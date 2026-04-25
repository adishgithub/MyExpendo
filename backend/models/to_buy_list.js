const mongoose = require('mongoose');

const toBuyListSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
    item_id: {
        type: String,
        required: true
    },
    item_name: {
        type: String,
        required: false,
    },
    product_category_id: {
        type: String,
        required: false,
    },
    priority_point: {
        type: Number,
        required: false,
    },
    status: {
        type: String,
        required: false,
    },
    expected_price: {
        type: Number,
        required: false,
    },
    actual_price: {
        type: Number,
        required: false,
    },
    added_date: {
        type: Date,
        required: false,
    },
    bought_date: {
        type: Date,
        required: false,
    },
});

module.exports = mongoose.model('to_buy_list', toBuyListSchema);