const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema(
    {
        expense_category_id: {
            type: String,
            required: true,
        },
        expense_category_name: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            ref: 'user_login_list',
            required: true,
        },
        source: {
            type: String,
            enum: ['manual', 'product', 'service', 'payment'],
            default: 'manual',
        },
        source_id: {
            type: String,
            required: false,
        },
    }
);

module.exports = mongoose.model('expense_category_list', expenseCategorySchema);