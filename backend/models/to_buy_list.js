const mongoose = require('mongoose');

const toBuyListSchema = new mongoose.Schema({
    item_name: {
        type: String,
        required: true,
    },
    product_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product_category_list',
        required: true,
    },
    priority_point: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    expected_price: {
        type: Number,
        required: true,
    },
    actual_price: {
        type: Number,
        required: true,
    },
    added_date: {
        type: Date,
        required: true,
    },
    bought_date: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('to_buy_list', toBuyListSchema);