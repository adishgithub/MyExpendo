const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');

// Import models
const ExpenseCategoryList = require('../models/expense_category_list');

// Create Expense Category API
router.post('/create', async (req, res) => {
    const { user_id, expense_category_name } = req.body;
    try {
        // Input validation
        if (!expense_category_name) {
            return res.status(400).json({ success: false, message: 'Expense category name is required' });
        }

        // Check if category already exists
        const existingCategory = await ExpenseCategoryList.findOne({ expense_category_name, user_id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Expense category already exists' });
        }

        // Create new expense category
        const newExpenseCategory = await ExpenseCategoryList.create({
            expense_category_id: uuidv4(),
            expense_category_name,
            user_id: user_id
        });
        return res.status(201).json({ success: true, message: 'Expense category created successfully', expenseCategory: newExpenseCategory });
    } catch (error) {
        console.error('Create Expense Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while creating expense category', error: error.message });
    }
});

// Get All Expense Categories API
router.get('/list', async (req, res) => {
    try {
        const { user_id } = req.query
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' })
        }
        const expenseCategories = await ExpenseCategoryList.find({ user_id });
        return res.status(200).json({ success: true, message: 'Expense categories fetched successfully', expenseCategories });
    } catch (error) {
        console.error('Get Expense Categories error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while fetching expense categories', error: error.message });
    }
});

// Get Dropdown Expense Categories API
router.get('/dropdown', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }
        const expenseCategories = await ExpenseCategoryList.find({ user_id }).select('expense_category_id expense_category_name');
        return res.status(200).json({ success: true, message: 'Dropdown expense categories fetched successfully', expenseCategories });
    } catch (error) {
        console.error('Get Dropdown Expense Categories error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while fetching dropdown expense categories', error: error.message });
    }
});

// Update Expense Category API
router.put('/update', async (req, res) => {
    const { user_id, expense_category_id, expense_category_name } = req.body;
    try {
        if (!expense_category_name) {
            return res.status(400).json({ success: false, message: 'Expense category name is required' })
        }

        const existingCategory = await ExpenseCategoryList.findOne({ expense_category_name, user_id: user_id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Expense category name already exists' })
        }

        const expenseCategory = await ExpenseCategoryList.findOne({ expense_category_id });
        if (!expenseCategory) {
            return res.status(404).json({ success: false, message: 'Expense category not found' })
        }
        if (expenseCategory.source && expenseCategory.source !== 'manual') {
            return res.status(403).json({
                success: false,
                message: `This category is managed by ${expenseCategory.source} categories and cannot be edited here.`
            })
        }

        expenseCategory.expense_category_name = expense_category_name
        await expenseCategory.save()

        return res.status(200).json({ success: true, message: 'Expense category updated successfully', expenseCategory })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating expense category', error: error.message })
    }
})

// Delete Expense Category API
router.delete('/delete', async (req, res) => {
    const { expense_category_id } = req.body;
    try {
        // Find the expense category by ID
        const expenseCategory = await ExpenseCategoryList.findOne({ expense_category_id })
        if (!expenseCategory) {
            return res.status(404).json({ success: false, message: 'Expense category not found' });
        }

        // Prevent deletion if category is linked to a source category
        if (expenseCategory.source && expenseCategory.source !== 'manual') {
            return res.status(403).json({
                success: false,
                message: `This category is managed by ${expenseCategory.source} categories and cannot be deleted here.`
            })
        }

        // Delete the expense category
        await ExpenseCategoryList.findOneAndDelete({ expense_category_id })
        return res.status(200).json({ success: true, message: 'Expense category deleted successfully' });

    } catch (error) {
        console.error('Delete Expense Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while deleting expense category', error: error.message });
    }
});

module.exports = router;