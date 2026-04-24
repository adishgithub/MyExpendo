const mongoose = require('mongoose');

const incomeCategorySchema = new mongoose.Schema(
    {
        income_category_id: {
            type: String,
            required: true,
        },
        income_category_name: {
            type: String,
            required: true,
        },
        user_id : {
            type: String,
            ref: 'user_login_list',
            required: true,
        },
    }
);

module.exports = mongoose.model('income_category_list', incomeCategorySchema);