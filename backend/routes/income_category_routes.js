const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');

// Import models
const IncomeCategoryList = require('../models/income_category_list');

// Create Income Category API
router.post('/create', async (req, res) => {
    const { user_id, income_category_name } = req.body;
    try {
        // Input validation
        if (!income_category_name) {
            return res.status(400).json({ success: false, message: 'Income category name is required' });
        }

        // Check if category already exists
        const existingCategory = await IncomeCategoryList.findOne({ income_category_name, user_id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Income category already exists' });
        }

        // Create new income category
        const newIncomeCategory = await IncomeCategoryList.create({
            income_category_id: uuidv4(),
            income_category_name,
            user_id: user_id

        });
        return res.status(201).json({ success: true, message: 'Income category created successfully', incomeCategory: newIncomeCategory });
    } catch (error) {
        console.error('Create Income Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while creating income category', error: error.message });
    }
});

// Get All Income Categories API
router.get('/list', async (req, res) => {
    try {
        const { user_id } = req.query
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' })
        }
        const incomeCategories = await IncomeCategoryList.find({ user_id })  // ← filter by user
        return res.status(200).json({ success: true, message: 'Income categories fetched successfully', incomeCategories })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching income categories', error: error.message })
    }
});

// Get Dropdown Income Categories API
router.get('/dropdown', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }
        const incomeCategories = await IncomeCategoryList.find({ user_id }).select('income_category_id income_category_name');
        return res.status(200).json({ success: true, message: 'Dropdown income categories fetched successfully', incomeCategories });
    } catch (error) {
        console.error('Get Dropdown Income Categories error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while fetching dropdown income categories', error: error.message });
    }
});

// Update Income Category API
router.put('/update', async (req, res) => {
    const { user_id, income_category_id, income_category_name } = req.body
    try {
        if (!income_category_name) {
            return res.status(400).json({ success: false, message: 'Income category name is required' })
        }

        const existingCategory = await IncomeCategoryList.findOne({ income_category_name, user_id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Income category name already exists' })
        }

        // ✅ search by the custom UUID field, not _id
        const incomeCategory = await IncomeCategoryList.findOne({ income_category_id, user_id })
        if (!incomeCategory) {
            return res.status(404).json({ success: false, message: 'Income category not found' })
        }

        incomeCategory.income_category_name = income_category_name
        await incomeCategory.save()

        return res.status(200).json({ success: true, message: 'Income category updated successfully', incomeCategory })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating income category', error: error.message })
    }
});

// Delete Income Category API
router.delete('/delete', async (req, res) => {
    const { user_id, income_category_id } = req.body;
    try {
        // ✅ search and delete by the custom UUID field
        const incomeCategory = await IncomeCategoryList.findOneAndDelete({ income_category_id, user_id });
        if (!incomeCategory) {
            return res.status(404).json({ success: false, message: 'Income category not found' });
        }

        return res.status(200).json({ success: true, message: 'Income category deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error occurred while deleting income category', error: error.message });
    }
});

module.exports = router;