const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');

// Import models
const ServiceCategoryList = require('../models/service_category_list');
const ExpenseCategoryList = require('../models/expense_category_list');

// Create Service Category API
router.post('/create', async (req, res) => {
    const { user_id, service_category_name } = req.body
    try {
        // Input validation
        if (!service_category_name) {
            return res.status(400).json({ success: false, message: 'Service category name is required' });
        }

        // Check if category already exists
        const existingCategory = await ServiceCategoryList.findOne({ service_category_name, user_id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Service category already exists' });
        }

        // Create new service category
        const newServiceCategory = await ServiceCategoryList.create({
            service_category_id: uuidv4(),
            service_category_name,
            user_id: user_id
        });

        // Also create linked expense category for this service category
        await ExpenseCategoryList.create({
            expense_category_id: uuidv4(),
            expense_category_name: service_category_name,
            user_id,
            source: 'service',
            source_id: newServiceCategory.service_category_id,
        })

        return res.status(201).json({ success: true, message: 'Service category created successfully', serviceCategory: newServiceCategory });
    } catch (error) {
        console.error('Create Service Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while creating service category', error: error.message });
    }
});

// Get All Service Categories API
router.get('/list', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }
        const serviceCategories = await ServiceCategoryList.find({ user_id });
        return res.status(200).json({ success: true, message: 'Service categories fetched successfully', serviceCategories });
    } catch (error) {
        console.error('Get Service Categories error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while fetching service categories', error: error.message });
    }
});

// Get Dropdown Service Categories API
router.get('/dropdown', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }
        const serviceCategories = await ServiceCategoryList.find({ user_id }).select('service_category_id, service_category_name');
        return res.status(200).json({ success: true, message: 'Dropdown service categories fetched successfully', serviceCategories });
    } catch (error) {
        console.error('Get Dropdown Service Categories error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while fetching dropdown service categories', error: error.message });
    }
});

// Update Service Category API
router.put('/update', async (req, res) => {
    const { user_id, service_category_id, service_category_name } = req.body;
    try {
        // Input validation
        if (!service_category_name) {
            return res.status(400).json({ success: false, message: 'Service category name is required' });
        }
        // Check if category already exists
        const existingCategory = await ServiceCategoryList.findOne({ service_category_name, user_id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Service category name already exists' });
        }

        // Find the service category by ID
        const serviceCategory = await ServiceCategoryList.findOne({ service_category_id })
        if (!serviceCategory) {
            return res.status(404).json({ success: false, message: 'Service category not found' });
        }

        // Update the service category
        serviceCategory.service_category_name = service_category_name;
        await serviceCategory.save();

        // Sync name to linked expense category
        await ExpenseCategoryList.findOneAndUpdate(
            { source_id: serviceCategory.service_category_id },
            { expense_category_name: service_category_name }
        )

        return res.status(200).json({ success: true, message: 'Service category updated successfully', serviceCategory });
    } catch (error) {
        console.error('Update Service Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while updating service category', error: error.message });
    }
});

// Delete Service Category API
router.delete('/delete', async (req, res) => {
    const { service_category_id } = req.body;
    try {
        // Find the service category by ID
        const serviceCategory = await ServiceCategoryList.findOne({ service_category_id })
        if (!serviceCategory) {
            return res.status(404).json({ success: false, message: 'Service category not found' });
        }
        // Remove linked expense category
        await ExpenseCategoryList.findOneAndDelete({ source_id: serviceCategory.service_category_id })
        // Delete the service category
        await ServiceCategoryList.findOneAndDelete({ service_category_id })
        return res.status(200).json({ success: true, message: 'Service category deleted successfully' });

    } catch (error) {
        console.error('Delete Service Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while deleting service category', error: error.message });
    }
});

module.exports = router;