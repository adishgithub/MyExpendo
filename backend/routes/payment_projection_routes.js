const express = require('express');
const router = express.Router();
const PaymentAccount = require('../models/payment_account_list');
const PaymentTransaction = require('../models/payment_transaction_list');

// ── helpers ───────────────────────────────────────────────────────────────────
const daysBetween = (a, b) => Math.round(Math.abs(new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
const addDays     = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const addMonths   = (date, m)    => { const d = new Date(date); d.setMonth(d.getMonth() + m);  return d; };

// GET /api/paymentProjection/:loan_id?user_id=xxx
router.get('/:loan_id', async (req, res) => {
    try {
        const { loan_id } = req.params;
        const { user_id  } = req.query;

        if (!loan_id || !user_id) {
            return res.status(400).json({ success: false, message: 'loan_id and user_id are required' });
        }

        // ── 1. Fetch account ──────────────────────────────────────────────
        const account = await PaymentAccount.findOne({ loan_id, user_id });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Loan account not found' });
        }

        if (account.outstanding_balance <= 0) {
            return res.status(200).json({
                success: true,
                message: 'Loan is fully paid off',
                loan_id,
                loan_name:           account.loan_name,
                loan_type:           account.loan_type,
                outstanding_balance: 0,
                projection:          null,
            });
        }

        // ── 2. Fetch all transactions sorted oldest→newest ────────────────
        const transactions = await PaymentTransaction
            .find({ loan_id })
            .sort({ payment_date: 1 });

        const payment_count = transactions.length;

        // ── 3. Confidence level ───────────────────────────────────────────
        const confidence = payment_count >= 6 ? 'high'
                         : payment_count >= 3 ? 'medium'
                         : 'low';

        // ── 4. Basis meta ─────────────────────────────────────────────────
        const first_payment_date = transactions[0]?.payment_date || new Date();
        const last_payment_date  = transactions[payment_count - 1]?.payment_date || new Date();
        const months_of_data     = Math.max(1,
            Math.round(daysBetween(first_payment_date, last_payment_date) / 30.44)
        );

        // ── 5. Averages from past transactions ────────────────────────────
        const total_paid_so_far     = transactions.reduce((s, t) => s + t.amount_paid,          0);
        const total_principal_so_far= transactions.reduce((s, t) => s + t.principal_component,  0);
        const total_interest_so_far = transactions.reduce((s, t) => s + t.interest_component,   0);

        const avg_payment_amount       = total_paid_so_far      / Math.max(payment_count, 1);
        const avg_principal_per_payment= total_principal_so_far / Math.max(payment_count, 1);
        const avg_interest_per_payment = total_interest_so_far  / Math.max(payment_count, 1);

        // Average interval between payments (days)
        let avg_payment_interval_days = 30; // default to monthly
        if (payment_count >= 2) {
            const totalGap = transactions.slice(1).reduce((sum, tx, i) =>
                sum + daysBetween(transactions[i].payment_date, tx.payment_date), 0);
            avg_payment_interval_days = Math.round(totalGap / (payment_count - 1));
        }

        // Effective annual rate = average of all interest_rate_applied values
        const ratedTxns = transactions.filter(t => t.interest_rate_applied > 0);
        const effective_annual_rate = ratedTxns.length > 0
            ? parseFloat((ratedTxns.reduce((s, t) => s + t.interest_rate_applied, 0) / ratedTxns.length).toFixed(4))
            : 0;

        // ── 6. Projection ─────────────────────────────────────────────────
        let payments_remaining, interest_remaining, projected_end_date, months_remaining;

        if (account.loan_type === 'fixed' && account.emi_amount > 0 && account.interest_rate > 0) {
            // Standard amortisation for fixed loans
            const monthlyRate = (account.interest_rate / 100) / 12;
            if (monthlyRate > 0) {
                payments_remaining = Math.ceil(
                    -Math.log(1 - (account.outstanding_balance * monthlyRate) / account.emi_amount) /
                    Math.log(1 + monthlyRate)
                );
            } else {
                payments_remaining = Math.ceil(account.outstanding_balance / account.emi_amount);
            }
            interest_remaining   = Math.max(0, (payments_remaining * account.emi_amount) - account.outstanding_balance);
            months_remaining     = payments_remaining;
            projected_end_date   = addMonths(new Date(), payments_remaining);

        } else {
            // Flexible — use weighted moving average
            if (avg_principal_per_payment <= 0) {
                return res.status(422).json({ success: false, message: 'Not enough payment data to project.' });
            }
            payments_remaining   = Math.ceil(account.outstanding_balance / avg_principal_per_payment);
            interest_remaining   = payments_remaining * avg_interest_per_payment;
            const days_remaining = payments_remaining * avg_payment_interval_days;
            months_remaining     = Math.round(days_remaining / 30.44);
            projected_end_date   = addDays(new Date(), days_remaining);
        }

        const principal_remaining = account.outstanding_balance;
        const total_remaining     = principal_remaining + interest_remaining;
        const days_remaining_num  = daysBetween(new Date(), projected_end_date);
        const next_expected_payment_date = payment_count > 0
            ? addDays(last_payment_date, avg_payment_interval_days)
            : addDays(new Date(), avg_payment_interval_days);

        // ── 7. Contributor projections ────────────────────────────────────
        const contributor_projections = [];

        if (account.contributors?.length > 0) {
            // Build per-contributor totals from all split records
            const splitTotals = {};
            let grand_split_total = 0;

            transactions.forEach(tx => {
                (tx.contributor_splits || []).forEach(s => {
                    if (!splitTotals[s.name]) {
                        splitTotals[s.name] = { amount: 0, user_id: s.user_id || null };
                    }
                    splitTotals[s.name].amount += s.amount || 0;
                    grand_split_total += s.amount || 0;
                });
            });

            account.contributors.forEach(c => {
                const paid      = splitTotals[c.name]?.amount || 0;
                const share_pct = grand_split_total > 0
                    ? parseFloat(((paid / grand_split_total) * 100).toFixed(2))
                    : parseFloat((100 / account.contributors.length).toFixed(2)); // equal split if no data

                const remaining_amount  = parseFloat((total_remaining * (share_pct / 100)).toFixed(2));
                const per_payment_amount= parseFloat((remaining_amount / Math.max(payments_remaining, 1)).toFixed(2));

                contributor_projections.push({
                    name:              c.name,
                    user_id:           c.user_id || splitTotals[c.name]?.user_id || null,
                    share_pct,
                    amount_paid_so_far: parseFloat(paid.toFixed(2)),
                    remaining_amount,
                    per_payment_amount,
                    payments_remaining,
                });
            });
        }

        // ── 8. Respond ────────────────────────────────────────────────────
        res.status(200).json({
            success: true,
            loan_id,
            loan_name:           account.loan_name,
            loan_type:           account.loan_type,
            outstanding_balance: account.outstanding_balance,
            projection: {
                confidence,
                payments_remaining,
                projected_end_date,
                months_remaining,
                days_remaining: days_remaining_num,

                total_remaining:     parseFloat(total_remaining.toFixed(2)),
                interest_remaining:  parseFloat(interest_remaining.toFixed(2)),
                principal_remaining: parseFloat(principal_remaining.toFixed(2)),

                avg_payment_amount:        parseFloat(avg_payment_amount.toFixed(2)),
                avg_principal_per_payment: parseFloat(avg_principal_per_payment.toFixed(2)),
                avg_interest_per_payment:  parseFloat(avg_interest_per_payment.toFixed(2)),
                avg_payment_interval_days,
                next_expected_payment_date,

                effective_annual_rate,
                contributor_projections,

                based_on: {
                    payment_count,
                    months_of_data,
                    first_payment_date,
                    last_payment_date,
                },
            },
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate projection', error: error.message });
    }
});

module.exports = router;