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
            added_date: added_date ? new Date(added_date) : new Date(),
            bought_date: null,
        });

        res.status(201).json({ success: true, message: 'Item added to buy list successfully', item: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add item to buy list', error: error.message });
    }
});

// List to-buy items
router.get('/list', async (req, res) => {
    try {
        const { user_id, search, status } = req.query;
        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 20;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }

        // ── Base match: always filter by user ──────────────────────────────────
        const baseMatch = { $match: { user_id } };

        // ── Lookup category name ───────────────────────────────────────────────
        const lookupStages = [
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
        ];

        // ── Optional search filter ─────────────────────────────────────────────
        const searchStages = search ? [{
            $match: {
                $or: [
                    { item_name: { $regex: search, $options: 'i' } },
                    { status: { $regex: search, $options: 'i' } },
                    { product_category_name: { $regex: search, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$expected_price' }, regex: search } } },
                    { $expr: { $regexMatch: { input: { $toString: '$actual_price' }, regex: search } } },
                ],
            },
        }] : [];

        // ── Optional status filter (applied AFTER search so counts stay accurate) ──
        const statusFilterStage = status
            ? [{ $match: { status: { $regex: `^${status}$`, $options: 'i' } } }]
            : [];

        const sortStage = { $sort: { priority_point: -1, added_date: -1 } };

        // ── Pipeline ───────────────────────────────────────────────────────────
        //   Two separate aggregations:
        //   1. countsPipeline  — counts per status (always across full search result,
        //                        ignoring the active status tab so all badge numbers
        //                        stay live)
        //   2. mainPipeline    — filtered + paginated items + summary

        const countsPipeline = [
            baseMatch,
            ...lookupStages,
            ...searchStages,          // ← search applied, but NOT status filter
            sortStage,
            {
                $group: {
                    _id: { $toLower: '$status' },
                    count: { $sum: 1 },
                },
            },
        ];

        // In your /list route, replace the mainPipeline with two separate facets.
        // The summary runs from the base match only (no search, no status filter).

        const summaryPipeline = [
            { $match: { user_id } },
            {
                $group: {
                    _id: null,
                    totalExpected: {
                        $sum: {
                            $cond: [
                                { $eq: [{ $toLower: '$status' }, 'not ordered'] },
                                '$expected_price',
                                0,
                            ],
                        },
                    },
                    totalActualPaid: { $sum: '$actual_price' },
                    totalItems: { $sum: 1 },
                    boughtItems: {
                        $sum: { $cond: [{ $eq: [{ $toLower: '$status' }, 'done'] }, 1, 0] },
                    },
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
        ];

        const mainPipeline = [
            baseMatch,
            ...lookupStages,
            ...searchStages,
            ...statusFilterStage,
            sortStage,
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    items: [{ $skip: offset }, { $limit: limit }],
                },
            },
        ];

        // Run all three in parallel
        const [countsRaw, [mainResult], summaryRaw] = await Promise.all([
            ToBuyList.aggregate(countsPipeline),
            ToBuyList.aggregate(mainPipeline),
            ToBuyList.aggregate(summaryPipeline),
        ]);

        // ← ADD THIS BLOCK
        const statusCounts = { 'not ordered': 0, ordered: 0, done: 0 };
        for (const row of countsRaw) {
            const key = row._id;
            if (key in statusCounts) statusCounts[key] = row.count;
        }

        const total = mainResult.total[0]?.count || 0;  // ← ADD THIS TOO

        const summaryData = summaryRaw[0] || {};
        const summary = {
            totalExpected: summaryData.totalExpected || 0,
            totalActual: summaryData.totalActualPaid || 0,
            saved: Math.max(0, summaryData.savedFromDone || 0),
            totalItems: summaryData.totalItems || 0,
            boughtItems: summaryData.boughtItems || 0,
        };

        res.status(200).json({
            success: true,
            message: 'Buy list fetched successfully',
            items: mainResult.items,
            summary,
            statusCounts,           // ← NEW: tab badge numbers
            pagination: {
                total,
                offset,
                limit,
                hasNextPage: offset + limit < total,
                hasPrevPage: offset > 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch buy list', error: error.message });
    }
});

// Update to-buy item
router.put('/update', async (req, res) => {
    try {
        const {
            item_id, item_name, product_category_id, priority_point,
            status, expected_price, actual_price, added_date, bought_date,
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
                ...(status?.toLowerCase() === 'done' && !bought_date && { bought_date: new Date() }),
                ...(bought_date !== undefined && { bought_date }),
            },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // ── Expense sync ────────────────────────────────────────────────────────
        if (status) {
            const normalised = status.toLowerCase();
            const existingExpense = await ExpenseList.findOne({ source_item_id: item_id });

            if (normalised === 'ordered') {
                // CREATE expense once — on first transition to Ordered
                if (!existingExpense) {
                    await ExpenseList.create({
                        expense_id: uuidv4(),
                        user_id: updatedItem.user_id,
                        expense_category_id: updatedItem.product_category_id,
                        amount: updatedItem.actual_price || updatedItem.expected_price,
                        date: new Date(),
                        description: updatedItem.item_name,
                        source_item_id: item_id,
                    });
                }
            } else if (normalised === 'done') {
                // UPDATE existing expense with the confirmed actual price + bought date
                if (existingExpense) {
                    await ExpenseList.findOneAndUpdate(
                        { source_item_id: item_id },
                        {
                            amount: updatedItem.actual_price || existingExpense.amount,
                            date: updatedItem.bought_date || existingExpense.date,
                            description: updatedItem.item_name,
                            expense_category_id: updatedItem.product_category_id,
                        }
                    );
                } else {
                    // Edge case: item jumped straight to Done without going through Ordered
                    await ExpenseList.create({
                        expense_id: uuidv4(),
                        user_id: updatedItem.user_id,
                        expense_category_id: updatedItem.product_category_id,
                        amount: updatedItem.actual_price || updatedItem.expected_price,
                        date: updatedItem.bought_date || new Date(),
                        description: updatedItem.item_name,
                        source_item_id: item_id,
                    });
                }
            }
        }

        res.status(200).json({ success: true, message: 'Item updated successfully', item: updatedItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update item', error: error.message });
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

        // Clean up linked expense if it exists
        await ExpenseList.deleteOne({ source_item_id: item_id });

        res.status(200).json({ success: true, message: 'Item deleted successfully', item: deletedItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete item', error: error.message });
    }
});

module.exports = router;