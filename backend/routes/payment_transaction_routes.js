const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const PaymentTransaction = require('../models/payment_transaction_list');
const PaymentAccount = require('../models/payment_account_list');
const ExpenseList = require('../models/expense_list');

// Record a payment
// For flexible loans: user sends amount_paid + interest_component + principal_component.
//   interest_rate_applied is back-calculated here: (interest / outstanding_before) * 12 * 100
// For fixed loans: all three components are sent from the frontend (calculated from schedule).
router.post('/create', async (req, res) => {
    try {
        const {
            loan_id,
            user_id,
            amount_paid,
            principal_component,
            interest_component,
            penalty_component = 0,
            payment_date,
            payment_type = 'emi',
            payment_mode,
            contributor_splits,
            notes,
        } = req.body;

        if (!loan_id || !user_id || !amount_paid || !payment_date) {
            return res.status(400).json({ success: false, message: 'loan_id, user_id, amount_paid and payment_date are required' });
        }

        if (principal_component === undefined || interest_component === undefined) {
            return res.status(400).json({ success: false, message: 'principal_component and interest_component are required' });
        }

        // Fetch the loan account to get current outstanding balance
        const account = await PaymentAccount.findOne({ loan_id, user_id });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Loan account not found' });
        }

        if (account.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Cannot add payment to a closed loan' });
        }

        const outstanding_before = account.outstanding_balance;
        const outstanding_after = Math.max(0, outstanding_before - principal_component);

        // Back-calculate annual interest rate from the components
        // Formula: (interest_component / outstanding_before) * 12 * 100
        let interest_rate_applied = null;
        if (outstanding_before > 0 && interest_component > 0) {
            interest_rate_applied = parseFloat(((interest_component / outstanding_before) * 12 * 100).toFixed(4));
        }

        // Create the transaction
        const newTransaction = await PaymentTransaction.create({
            payment_id: uuidv4(),
            loan_id,
            user_id,
            amount_paid,
            principal_component,
            interest_component,
            penalty_component,
            interest_rate_applied,
            outstanding_before_payment: outstanding_before,
            outstanding_after_payment: outstanding_after,
            contributor_splits: Array.isArray(contributor_splits) ? contributor_splits : [],
            payment_date: new Date(payment_date),
            payment_type,
            payment_mode,
            notes,
            synced_expense_id: null,
        });

        // ── Update outstanding balance on the loan account ──────────────
        const updatePayload = { outstanding_balance: outstanding_after };
        // Auto-close loan if fully paid
        if (outstanding_after === 0) {
            updatePayload.status = 'closed';
        }
        await PaymentAccount.findOneAndUpdate({ loan_id }, updatePayload);

        // ── Auto-sync to expense_list — only the user's own contribution ────
        // Find the split that belongs to this user (matched by user_id on the split)
        // If no splits recorded, fall back to full amount_paid (solo payment)
        const userSplit = Array.isArray(contributor_splits) && contributor_splits.length > 0
            ? contributor_splits.find(s => s.user_id === user_id)
            : null

        const expenseAmount = userSplit ? userSplit.amount : amount_paid

        const expenseDescription = notes
            ? `${account.loan_name} — ${notes}`
            : `${account.loan_name} payment`

        const newExpense = await ExpenseList.create({
            expense_id: uuidv4(),
            user_id,
            expense_category_id: account.payment_category_id,  // ← use loan's payment_category_id
            amount: expenseAmount,                 // ← only user's share
            date: new Date(payment_date),
            description: expenseDescription,
            source_loan_payment_id: newTransaction.payment_id,
        })

        // Store the expense link back on the transaction
        await PaymentTransaction.findOneAndUpdate(
            { payment_id: newTransaction.payment_id },
            { synced_expense_id: newExpense.expense_id }
        );

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            transaction: { ...newTransaction.toObject(), synced_expense_id: newExpense.expense_id },
            updated_outstanding: outstanding_after,
            interest_rate_applied,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
    }
});

// List transactions for a loan
router.get('/list', async (req, res) => {
    try {
        const { loan_id, user_id } = req.query;

        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 20;

        if (!loan_id || !user_id) {
            return res.status(400).json({ success: false, message: 'loan_id and user_id are required' });
        }

        const pipeline = [
            { $match: { loan_id, user_id } },
            { $sort: { payment_date: -1 } },
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    totalPaid: [{ $group: { _id: null, sum: { $sum: '$amount_paid' } } }],
                    totalInterest: [{ $group: { _id: null, sum: { $sum: '$interest_component' } } }],
                    transactions: [{ $skip: offset }, { $limit: limit }],
                }
            }
        ];

        const [result] = await PaymentTransaction.aggregate(pipeline);

        res.status(200).json({
            success: true,
            message: 'Transactions fetched successfully',
            transactions: result.transactions,
            totalPaid: result.totalPaid[0]?.sum || 0,
            totalInterest: result.totalInterest[0]?.sum || 0,
            pagination: {
                total: result.total[0]?.count || 0,
                offset,
                limit,
                hasNextPage: offset + limit < (result.total[0]?.count || 0),
                hasPrevPage: offset > 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
});

// Update a transaction (note/mode only — amounts are immutable once saved)
router.put('/update', async (req, res) => {
    try {
        const { payment_id, payment_mode, notes } = req.body;

        if (!payment_id) {
            return res.status(400).json({ success: false, message: 'payment_id is required' });
        }

        const updated = await PaymentTransaction.findOneAndUpdate(
            { payment_id },
            {
                ...(payment_mode !== undefined && { payment_mode }),
                ...(notes !== undefined && { notes }),
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.status(200).json({ success: true, message: 'Transaction updated successfully', transaction: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update transaction', error: error.message });
    }
});

// Delete a transaction (also reverses the outstanding balance on the loan)
router.delete('/delete', async (req, res) => {
    try {
        const { payment_id } = req.body;

        if (!payment_id) {
            return res.status(400).json({ success: false, message: 'payment_id is required' });
        }

        const transaction = await PaymentTransaction.findOne({ payment_id });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        // Reverse the principal reduction on the loan account
        await PaymentAccount.findOneAndUpdate(
            { loan_id: transaction.loan_id },
            {
                $inc: { outstanding_balance: transaction.principal_component },
                status: 'active',  // re-open if it was auto-closed
            }
        );

        // Delete the linked expense entry (if it was auto-synced)
        if (transaction.synced_expense_id) {
            await ExpenseList.findOneAndDelete({ expense_id: transaction.synced_expense_id });
        }

        await PaymentTransaction.findOneAndDelete({ payment_id });

        res.status(200).json({ success: true, message: 'Transaction deleted and balance reversed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete transaction', error: error.message });
    }
});

module.exports = router;