const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Import models
const ProductCategoryList = require('../models/product_category_list');
const ExpenseCategoryList = require('../models/expense_category_list');

// Create Product Category API
router.post('/create', async (req, res) => {
    const { user_id, product_category_name } = req.body;
    try {
        // Input validation
        if (!product_category_name) {
            return res.status(400).json({ success: false, message: 'Product category name is required' });
        }

        // Check if category already exists
        const existingCategory = await ProductCategoryList.findOne({ product_category_name, user_id })
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Product category already exists' });
        }

        // Create new product category
        const newProductCategory = await ProductCategoryList.create({
            product_category_id: uuidv4(),
            product_category_name,
            user_id: user_id
        });

        // Also create linked expense category for this product category
        await ExpenseCategoryList.create({
            expense_category_id: uuidv4(),
            expense_category_name: product_category_name,
            user_id,
            source: 'product',
            source_id: newProductCategory.product_category_id,
        })

        return res.status(201).json({ success: true, message: 'Product category created successfully', productCategory: newProductCategory });
    } catch (error) {
        console.error('Create Product Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while creating product category', error: error.message });
    }
});

// Get All Product Categories API
router.get('/list', async (req, res) => {
    try {
        const { user_id } = req.query
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' })
        }
        const productCategories = await ProductCategoryList.find({ user_id })
        return res.status(200).json({ success: true, message: 'Product categories fetched successfully', productCategories })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error occurred while fetching product categories', error: error.message })
    }
});

// Get Dropdown Product Categories API
router.get('/dropdown', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }
        const productCategories = await ProductCategoryList.find({ user_id }).select('product_category_id, product_category_name');
        return res.status(200).json({ success: true, message: 'Dropdown product categories fetched successfully', productCategories });
    } catch (error) {
        console.error('Get Dropdown Product Categories error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while fetching dropdown product categories', error: error.message });
    }
});

// Update Product Category API
router.put('/update', async (req, res) => {
    const { user_id, product_category_id, product_category_name } = req.body;
    try {
        // Input validation
        if (!product_category_name) {
            return res.status(400).json({ success: false, message: 'Product category name is required' });
        }
        // Check if category already exists
        const existingCategory = await ProductCategoryList.findOne({ product_category_name, user_id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Product category name already exists' });
        }

        // Find the product category by ID
        const productCategory = await ProductCategoryList.findOne({ product_category_id })
        if (!productCategory) {
            return res.status(404).json({ success: false, message: 'Product category not found' });
        }

        // Update the product category
        productCategory.product_category_name = product_category_name;
        await productCategory.save();

        // Sync name to linked expense category
        await ExpenseCategoryList.findOneAndUpdate(
            { source_id: productCategory.product_category_id },
            { expense_category_name: product_category_name }
        )

        return res.status(200).json({ success: true, message: 'Product category updated successfully', productCategory });
    } catch (error) {
        console.error('Update Product Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while updating product category', error: error.message });
    }
});

// Delete Product Category API
router.delete('/delete', async (req, res) => {
    const { user_id, product_category_id } = req.body;
    try {
        // Find the product category by ID
        const productCategory = await ProductCategoryList.findOne({ product_category_id })
        if (!productCategory) {
            return res.status(404).json({ success: false, message: 'Product category not found' });
        }
        // Remove linked expense category
        await ExpenseCategoryList.findOneAndDelete({ source_id: productCategory.product_category_id })
        // Delete the product category
        await ProductCategoryList.findOneAndDelete({ product_category_id })
        return res.status(200).json({ success: true, message: 'Product category deleted successfully' });

    } catch (error) {
        console.error('Delete Product Category error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while deleting product category', error: error.message });
    }
});

module.exports = router;