const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema(
    {
        product_category_id: {
            type: String,
            required: true,
        },
        product_category_name: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            ref: 'user_login_list',
            required: true,
        },
    }
);

module.exports = mongoose.model('product_category_list', productCategorySchema);