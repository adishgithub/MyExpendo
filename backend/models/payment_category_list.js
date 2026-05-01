const mongoose = require('mongoose');

// Stores loan/payment categories like: Home Loan, Vehicle Loan,
// Gold Loan, Personal Loan, Credit Card, Buy Now Pay Later, etc.
const paymentCategorySchema = new mongoose.Schema(
    {
        payment_category_id: {
            type: String,
            required: true,
            unique: true,
        },
        payment_category_name: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            ref: 'user_login_list',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('payment_category_list', paymentCategorySchema);