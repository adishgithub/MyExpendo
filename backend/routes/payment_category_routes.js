const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const PaymentCategory = require('../models/payment_category_list');
const ExpenseCategoryList = require('../models/expense_category_list');

// Create
router.post('/create', async (req, res) => {
    try {
        const { user_id, payment_category_name } = req.body;

        if (!user_id || !payment_category_name) {
            return res.status(400).json({ success: false, message: 'user_id and payment_category_name are required' });
        }

        const newCategory = await PaymentCategory.create({
            payment_category_id: uuidv4(),
            user_id,
            payment_category_name,
        });

        // Also create linked expense category for this payment category
        await ExpenseCategoryList.create({
            expense_category_id: uuidv4(),
            expense_category_name: payment_category_name,
            user_id,
            source: 'payment',
            source_id: newCategory.payment_category_id,
        })


        res.status(201).json({ success: true, message: 'Payment category created successfully', category: newCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create payment category', error: error.message });
    }
});

// List
router.get('/list', async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }

        const categories = await PaymentCategory.find({ user_id }).sort({ payment_category_name: 1 });

        res.status(200).json({ success: true, message: 'Payment categories fetched successfully', paymentCategories: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch payment categories', error: error.message });
    }
});

// Update
router.put('/update', async (req, res) => {
    try {
        const { payment_category_id, payment_category_name } = req.body;

        if (!payment_category_id) {
            return res.status(400).json({ success: false, message: 'payment_category_id is required' });
        }

        const updated = await PaymentCategory.findOneAndUpdate(
            { payment_category_id },
            { ...(payment_category_name !== undefined && { payment_category_name }) },
            { new: true }
        );

        // Sync name to linked expense category if name is updated
        await ExpenseCategoryList.findOneAndUpdate(
            { source_id: payment_category_id },
            { expense_category_name: payment_category_name }
        )

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Payment category not found' });
        }

        res.status(200).json({ success: true, message: 'Payment category updated successfully', category: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update payment category', error: error.message });
    }
});

// Delete
router.delete('/delete', async (req, res) => {
    try {
        const { payment_category_id } = req.body;

        if (!payment_category_id) {
            return res.status(400).json({ success: false, message: 'payment_category_id is required' });
        }

        const toDelete = await PaymentCategory.findOne({ payment_category_id });
        if (!toDelete) {
            return res.status(404).json({ success: false, message: 'Payment category not found' });
        }

        await PaymentCategory.findOneAndDelete({ payment_category_id });

        // Use toDelete.payment_category_id, same pattern as product route
        await ExpenseCategoryList.findOneAndDelete({ source_id: toDelete.payment_category_id });

        res.status(200).json({ success: true, message: 'Payment category deleted successfully', category: toDelete });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete payment category', error: error.message });
    }
});

module.exports = router;