const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ToBuyList = require('../models/to_buy_list');
const ExpenseList = require('../models/expense_list');

// Create to-buy item
router.post('/create', async (req, res) => {
    try {
        const { user_id, item_name, product_category_id, expected_price, added_date } = req.body;

        if (!user_id || !item_name || !product_category_id || expected_price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'user_id, item_name, product_category_id and expected_price are required',
            });
        }

        const newItem = await ToBuyList.create({
            item_id: uuidv4(),
            user_id,
            item_name,
            product_category_id,
            priority_point: 1,
            status: 'not ordered',
            expected_price,
            actual_price: 0,
            added_date: added_date ? new Date(added_date) : new Date(), // ← use frontend date if provided
            bought_date: null,
        });

        res.status(201).json({
            success: true,
            message: 'Item added to buy list successfully',
            item: newItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add item to buy list',
            error: error.message,
        });
    }
});

// List to-buy items
router.get('/list', async (req, res) => {
    try {
        const { user_id, search } = req.query;

        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 20;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }

        const pipeline = [
            { $match: { user_id } },

            {
                $lookup: {
                    from: 'product_category_lists',
                    localField: 'product_category_id',
                    foreignField: 'product_category_id',
                    as: 'category',
                },
            },

            {
                $addFields: {
                    product_category_name: { $arrayElemAt: ['$category.product_category_name', 0] },
                },
            },

            { $project: { category: 0, __v: 0 } },

            ...(search ? [{
                $match: {
                    $or: [
                        { item_name: { $regex: search, $options: 'i' } },
                        { status: { $regex: search, $options: 'i' } },
                        { product_category_name: { $regex: search, $options: 'i' } },
                        { $expr: { $regexMatch: { input: { $toString: '$expected_price' }, regex: search } } },
                        { $expr: { $regexMatch: { input: { $toString: '$actual_price' }, regex: search } } },
                    ],
                },
            }] : []),

            { $sort: { priority_point: -1, added_date: -1 } },

            {
                $facet: {
                    total: [{ $count: 'count' }],
                    // ── Summary totals across ALL matched items (not just current page) ──
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalExpected: { $sum: '$expected_price' },
                                totalActualPaid: { $sum: '$actual_price' },
                                totalItems: { $sum: 1 },
                                boughtItems: {
                                    $sum: { $cond: [{ $eq: [{ $toLower: '$status' }, 'done'] }, 1, 0] },
                                },
                                // Sum (expected - actual) only for Done items
                                savedFromDone: {
                                    $sum: {
                                        $cond: [
                                            { $eq: [{ $toLower: '$status' }, 'done'] },
                                            { $subtract: ['$expected_price', '$actual_price'] },
                                            0,
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                    items: [
                        { $skip: offset },
                        { $limit: limit },
                    ],
                },
            },
        ];

        const [result] = await ToBuyList.aggregate(pipeline);

        const total = result.total[0]?.count || 0;
        const summaryRaw = result.summary[0] || { totalExpected: 0, totalActualPaid: 0, totalItems: 0, boughtItems: 0 };
        const summary = {
            totalExpected: summaryRaw.totalExpected,
            totalActual: summaryRaw.totalActualPaid,
            saved: Math.max(0, summaryRaw.savedFromDone),  // ← only Done items
            totalItems: summaryRaw.totalItems,
            boughtItems: summaryRaw.boughtItems,
        };

        res.status(200).json({
            success: true,
            message: 'Buy list fetched successfully',
            items: result.items,
            summary,
            pagination: {
                total,
                offset,
                limit,
                hasNextPage: offset + limit < total,
                hasPrevPage: offset > 0,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch buy list',
            error: error.message,
        });
    }
});

// Update to-buy item
router.put('/update', async (req, res) => {
    try {
        const {
            item_id,
            item_name,
            product_category_id,
            priority_point,
            status,
            expected_price,
            actual_price,
            added_date,
            bought_date,
        } = req.body;

        if (!item_id) {
            return res.status(400).json({ success: false, message: 'item_id is required' });
        }

        const updatedItem = await ToBuyList.findOneAndUpdate(
            { item_id },
            {
                ...(item_name !== undefined && { item_name }),
                ...(product_category_id !== undefined && { product_category_id }),
                ...(priority_point !== undefined && { priority_point }),
                ...(status !== undefined && { status }),
                ...(expected_price !== undefined && { expected_price }),
                ...(actual_price !== undefined && { actual_price }),
                ...(added_date !== undefined && { added_date }),
                // Auto-set bought_date when marking Done and none provided
                ...(status?.toLowerCase() === 'done' && !bought_date && { bought_date: new Date() }),
                ...(bought_date !== undefined && { bought_date }),
            },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // ── Sync to expense list when status is set to "Done" ──────────
        // Guard: only create expense if one hasn't been created for this item yet
        if (status && status.toLowerCase() === 'ordered' ) {
            const existingExpense = await ExpenseList.findOne({ source_item_id: item_id });

            if (!existingExpense) {
                const expenseDate = updatedItem.bought_date || new Date();

                await ExpenseList.create({
                    expense_id: uuidv4(),
                    user_id: updatedItem.user_id,
                    expense_category_id: updatedItem.product_category_id,
                    amount: updatedItem.actual_price,
                    date: expenseDate,
                    description: updatedItem.item_name,
                    source_item_id: item_id, // ← link to prevent duplicates
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Item updated successfully',
            item: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update item',
            error: error.message,
        });
    }
});

// Delete to-buy item
router.delete('/delete', async (req, res) => {
    try {
        const { item_id } = req.body;

        if (!item_id) {
            return res.status(400).json({ success: false, message: 'item_id is required' });
        }

        const deletedItem = await ToBuyList.findOneAndDelete({ item_id });

        if (!deletedItem) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Item deleted successfully',
            item: deletedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete item',
            error: error.message,
        });
    }
});

module.exports = router;