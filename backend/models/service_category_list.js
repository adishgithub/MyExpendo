const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema(
    {
        service_category_id: {
            type: String,
            required: true,
        },
        service_category_name: {
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

module.exports = mongoose.model('service_category_list', serviceCategorySchema);