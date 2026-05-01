const mongoose = require('mongoose');

// Represents a loan account (e.g. HDFC Home Loan, Bajaj Bike EMI, Federal Bank Gold Loan).
// loan_type drives which fields are relevant:
//   "fixed"    → emi_amount, tenure_months, interest_rate are all set upfront
//   "flexible" → no fixed schedule; outstanding_balance is updated after each payment
const paymentAccountSchema = new mongoose.Schema(
    {
        loan_id: {
            type: String,
            required: true,
            unique: true,
        },
        user_id: {
            type: String,
            ref: 'user_login_list',
            required: true,
        },
        payment_category_id: {
            type: String,
            ref: 'payment_category_list',
            required: true,
        },

        // ── Basic loan info ───────────────────────────────────────────
        loan_name: {
            type: String,
            required: true,           // e.g. "HDFC Home Loan", "Federal Bank Gold Loan"
        },
        lender_name: {
            type: String,
            required: false,           // e.g. "HDFC", "Federal Bank", "Bajaj Finance"
        },
        loan_type: {
            type: String,
            enum: ['fixed', 'flexible'],
            required: true,
        },

        // ── Amounts ───────────────────────────────────────────────────
        principal_amount: {
            type: Number,
            required: true,            // Original loan amount sanctioned
        },
        outstanding_balance: {
            type: Number,
            required: true,            // Updated after every payment transaction
            // Initialised = principal_amount on creation
        },

        // ── Fixed loan fields (only used when loan_type === 'fixed') ──
        interest_rate: {
            type: Number,
            required: false,           // Annual percentage, e.g. 8.75
        },
        emi_amount: {
            type: Number,
            required: false,           // Fixed monthly instalment
        },
        tenure_months: {
            type: Number,
            required: false,           // Total repayment period in months
        },
        start_date: {
            type: Date,
            required: false,           // Loan disbursement / first EMI date
        },
        emi_due_day: {
            type: Number,
            required: false,           // Day of month EMI is due, e.g. 5
            min: 1,
            max: 31,
        },

        // ── Status ────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ['active', 'closed', 'paused'],
            default: 'active',
        },

        notes: {
            type: String,
            required: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('payment_account_list', paymentAccountSchema);