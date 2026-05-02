const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const PaymentAccount = require('../models/payment_account_list');
const PaymentTransaction = require('../models/payment_transaction_list');

// Create loan account
router.post('/create', async (req, res) => {
    try {
        const {
            user_id,
            payment_category_id,
            loan_name,
            lender_name,
            loan_type,
            principal_amount,
            interest_rate,
            emi_amount,
            tenure_months,
            start_date,
            emi_due_day,
            notes,
            contributors,
        } = req.body;

        if (!user_id || !loan_name || !loan_type || !principal_amount || !payment_category_id) {
            return res.status(400).json({ success: false, message: 'user_id, payment_category_id, loan_name, loan_type and principal_amount are required' });
        }

        if (!['fixed', 'flexible'].includes(loan_type)) {
            return res.status(400).json({ success: false, message: 'loan_type must be fixed or flexible' });
        }

        const newAccount = await PaymentAccount.create({
            loan_id: uuidv4(),
            user_id,
            payment_category_id,
            loan_name,
            lender_name,
            loan_type,
            principal_amount,
            outstanding_balance: principal_amount,  // starts at full principal
            interest_rate,
            emi_amount,
            contributors: Array.isArray(contributors) ? contributors : [],
            tenure_months,
            start_date,
            emi_due_day,
            notes,
            status: 'active',
        });

        res.status(201).json({ success: true, message: 'Loan account created successfully', account: newAccount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create loan account', error: error.message });
    }
});

// List loan accounts with summary stats from transactions
router.get('/list', async (req, res) => {
    try {
        const { user_id, status, loan_type } = req.query;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }

        const matchStage = { user_id };
        if (status) matchStage.status = status;
        if (loan_type) matchStage.loan_type = loan_type;

        const pipeline = [
            { $match: matchStage },

            // Join payment category
            {
                $lookup: {
                    from: 'payment_category_lists',
                    localField: 'payment_category_id',
                    foreignField: 'payment_category_id',
                    as: 'category',
                }
            },
            {
                $addFields: {
                    payment_category_name: { $arrayElemAt: ['$category.payment_category_name', 0] }
                }
            },

            // Join transactions for aggregated totals
            {
                $lookup: {
                    from: 'payment_transaction_lists',
                    localField: 'loan_id',
                    foreignField: 'loan_id',
                    as: 'transactions',
                }
            },
            {
                $addFields: {
                    total_paid: { $sum: '$transactions.amount_paid' },
                    total_interest_paid: { $sum: '$transactions.interest_component' },
                    total_principal_paid: { $sum: '$transactions.principal_component' },
                    payment_count: { $size: '$transactions' },
                    last_payment_date: {
                        $max: '$transactions.payment_date'
                    },
                }
            },
            { $project: { category: 0, transactions: 0, __v: 0 } },
            { $sort: { createdAt: -1 } },
        ];

        const accounts = await PaymentAccount.aggregate(pipeline);

        // Summary totals across all loans
        const summary = {
            total_outstanding: accounts.filter(a => a.status === 'active').reduce((s, a) => s + (a.outstanding_balance || 0), 0),
            total_principal_paid: accounts.reduce((s, a) => s + (a.total_principal_paid || 0), 0),
            total_interest_paid: accounts.reduce((s, a) => s + (a.total_interest_paid || 0), 0),
            active_loans: accounts.filter(a => a.status === 'active').length,
        };

        res.status(200).json({ success: true, message: 'Loan accounts fetched successfully', accounts, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch loan accounts', error: error.message });
    }
});

// Get single loan account with full transaction history
router.get('/detail', async (req, res) => {
    try {
        const { loan_id, user_id } = req.query;

        if (!loan_id || !user_id) {
            return res.status(400).json({ success: false, message: 'loan_id and user_id are required' });
        }

        const account = await PaymentAccount.findOne({ loan_id, user_id });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Loan account not found' });
        }

        const transactions = await PaymentTransaction.find({ loan_id }).sort({ payment_date: -1 });

        const total_paid = transactions.reduce((s, t) => s + t.amount_paid, 0);
        const total_interest_paid = transactions.reduce((s, t) => s + t.interest_component, 0);
        const total_principal_paid = transactions.reduce((s, t) => s + t.principal_component, 0);

        // For fixed loans: estimate months remaining
        let months_remaining = null;
        if (account.loan_type === 'fixed' && account.emi_amount > 0 && account.outstanding_balance > 0) {
            const monthlyRate = (account.interest_rate / 100) / 12;
            if (monthlyRate > 0) {
                months_remaining = Math.ceil(
                    -Math.log(1 - (account.outstanding_balance * monthlyRate) / account.emi_amount) /
                    Math.log(1 + monthlyRate)
                );
            } else {
                months_remaining = Math.ceil(account.outstanding_balance / account.emi_amount);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Loan detail fetched successfully',
            account,
            transactions,
            stats: { total_paid, total_interest_paid, total_principal_paid, months_remaining },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch loan detail', error: error.message });
    }
});

// Update loan account
router.put('/update', async (req, res) => {
    try {
        const {
            loan_id,
            payment_category_id,
            loan_name,
            lender_name,
            interest_rate,
            emi_amount,
            tenure_months,
            start_date,
            emi_due_day,
            status,
            notes,
            contributors,
        } = req.body;

        if (!loan_id) {
            return res.status(400).json({ success: false, message: 'loan_id is required' });
        }

        const updated = await PaymentAccount.findOneAndUpdate(
            { loan_id },
            {
                ...(payment_category_id !== undefined && { payment_category_id }),
                ...(loan_name !== undefined && { loan_name }),
                ...(lender_name !== undefined && { lender_name }),
                ...(interest_rate !== undefined && { interest_rate }),
                ...(emi_amount !== undefined && { emi_amount }),
                ...(tenure_months !== undefined && { tenure_months }),
                ...(start_date !== undefined && { start_date }),
                ...(emi_due_day !== undefined && { emi_due_day }),
                ...(contributors !== undefined && { contributors }),
                ...(status !== undefined && { status }),
                ...(notes !== undefined && { notes }),
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Loan account not found' });
        }

        res.status(200).json({ success: true, message: 'Loan account updated successfully', account: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update loan account', error: error.message });
    }
});

// Delete loan account (also deletes all its transactions)
router.delete('/delete', async (req, res) => {
    try {
        const { loan_id } = req.body;

        if (!loan_id) {
            return res.status(400).json({ success: false, message: 'loan_id is required' });
        }

        const deleted = await PaymentAccount.findOneAndDelete({ loan_id });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Loan account not found' });
        }

        // Cascade delete all transactions for this loan
        await PaymentTransaction.deleteMany({ loan_id });

        res.status(200).json({ success: true, message: 'Loan account and all transactions deleted successfully', account: deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete loan account', error: error.message });
    }
});

module.exports = router;