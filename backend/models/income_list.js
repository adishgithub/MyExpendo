const mongoose = require('mongoose');
const income_category = require('./income_category_list');

const incomeListSchema = new mongoose.Schema(
    {
        income_id: {
            type: String,
            required: true,
            unique: true,
        },
        income_category_id: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
    }
);

module.exports = mongoose.model('income_list', incomeListSchema);