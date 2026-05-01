const mongoose = require('mongoose');

// Stores every individual payment made against a loan account.
//
// For FIXED loans:
//   - amount_paid, interest_component, principal_component are
//     calculated from the amortisation schedule
//
// For FLEXIBLE loans:
//   - User enters amount_paid + interest_component + principal_component
//     directly (copied from bank statement / passbook)
//   - interest_rate is back-calculated and stored:
//       interest_rate = (interest_component / outstanding_before_payment) * 12 * 100
//   - outstanding_balance_after is updated on the parent loan_account after save
//
// Auto-expense sync:
//   - On every successful payment creation, a corresponding entry is
//     written to expense_list automatically (same pattern as buy-list → expense sync)
//   - source_loan_payment_id on expense_list prevents duplicate syncs
const paymentTransactionSchema = new mongoose.Schema(
    {
        payment_id: {
            type: String,
            required: true,
            unique: true,
        },
        loan_id: {
            type: String,
            ref: 'payment_account_list',
            required: true,
        },
        user_id: {
            type: String,
            ref: 'user_login_list',
            required: true,
        },

        // ── Payment amounts ───────────────────────────────────────────
        amount_paid: {
            type: Number,
            required: true,                // Total amount actually paid this instalment
        },
        principal_component: {
            type: Number,
            required: true,                // Portion that reduces the outstanding balance
        },
        interest_component: {
            type: Number,
            required: true,                // Portion charged as interest
        },
        penalty_component: {
            type: Number,
            default: 0,                    // Late fee / penalty, if any
        },

        // ── Derived / stored for history ──────────────────────────────
        // Back-calculated from the three components above.
        // Formula: (interest_component / outstanding_before_payment) * 12 * 100
        // Stored so dashboards can show rate-over-time charts without recalculating.
        interest_rate_applied: {
            type: Number,
            required: false,               // Annual % rate effective for this payment
        },
        outstanding_before_payment: {
            type: Number,
            required: true,                // Snapshot of balance before this payment
        },
        outstanding_after_payment: {
            type: Number,
            required: true,                // = outstanding_before - principal_component
        },

        // ── Meta ──────────────────────────────────────────────────────
        payment_date: {
            type: Date,
            required: true,
        },
        payment_type: {
            type: String,
            enum: ['emi', 'partial', 'interest_only', 'prepayment'],
            default: 'emi',
            // emi           → standard fixed instalment
            // partial       → flexible loan, paying what you can
            // interest_only → only interest paid, principal unchanged
            // prepayment    → extra lump-sum to reduce principal faster
        },
        payment_mode: {
            type: String,
            enum: ['auto_debit', 'upi', 'netbanking', 'cash', 'cheque', 'other'],
            required: false,
        },
        notes: {
            type: String,
            required: false,               // e.g. "Paid at branch", "May 2026 EMI"
        },

        // ── Expense sync link ─────────────────────────────────────────
        // Set after the corresponding expense_list record is created.
        // Used as a guard to prevent duplicate expense entries (same
        // pattern as source_item_id in the buy-list → expense sync).
        synced_expense_id: {
            type: String,
            ref: 'expense_list',
            required: false,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('payment_transaction_list', paymentTransactionSchema);