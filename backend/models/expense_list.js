const mongoose = require('mongoose');
const expense_category = require('./expense_category_list');
const { use } = require('react');

const expenseListSchema = new mongoose.Schema(
    {
        expense_id: {
            type: String,
            required: true,
            unique: true,
        },
        expense_category_id: {
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

module.exports = mongoose.model('expense_list', expenseListSchema);