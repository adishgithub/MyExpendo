const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ExpenseList = require('../models/expense_list');

// Create expense
router.post('/create', async (req, res) => {
    try {
        const { user_id, expense_category_id, amount, date, description } = req.body;

        if (!user_id || !amount || !date) {
            return res.status(400).json({ success: false, message: 'user_id, amount and date are required' });
        }

        const newExpense = await ExpenseList.create({
            expense_id: uuidv4(),
            user_id,
            expense_category_id,
            amount,
            date,
            description,
        });

        res.status(201).json({ success: true, message: 'Expense created successfully', expense: newExpense });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create expense', error: error.message });
    }
});

// List expenses
router.get('/list', async (req, res) => {
    try {
        const {
            user_id,
            from_date, to_date,
            expense_category_id,
            search,
        } = req.query;

        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 20;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }

        // ── Stage 1: match ──────────────────────────────────────────────
        const matchStage = { user_id };

        if (expense_category_id) {
            matchStage.expense_category_id = expense_category_id;
        }

        if (from_date && to_date) {
            matchStage.date = { $gte: new Date(from_date), $lte: new Date(to_date) };
        } else if (from_date) {
            matchStage.date = { $gte: new Date(from_date) };
        } else if (to_date) {
            matchStage.date = { $lte: new Date(to_date) };
        }

        // ── Aggregation pipeline ────────────────────────────────────────
        const pipeline = [
            { $match: matchStage },

            // Join expense_category_lists first
            {
                $lookup: {
                    from: 'expense_category_lists',
                    localField: 'expense_category_id',
                    foreignField: 'expense_category_id',
                    as: 'expense_category',
                }
            },

            // Fallback: join product_category_lists for expenses synced from buy list
            {
                $lookup: {
                    from: 'product_category_lists',
                    localField: 'expense_category_id',
                    foreignField: 'product_category_id',
                    as: 'product_category',
                }
            },

            // Use expense category name if found, otherwise fall back to product category name
            {
                $addFields: {
                    expense_category_name: {
                        $cond: {
                            if: { $gt: [{ $size: '$expense_category' }, 0] },
                            then: { $arrayElemAt: ['$expense_category.expense_category_name', 0] },
                            else: { $arrayElemAt: ['$product_category.product_category_name', 0] },
                        }
                    }
                }
            },

            // Remove the raw joined arrays
            { $project: { expense_category: 0, product_category: 0, __v: 0 } },

            // Search across description, category name, amount
            ...(search ? [{
                $match: {
                    $or: [
                        { description: { $regex: search, $options: 'i' } },
                        { expense_category_name: { $regex: search, $options: 'i' } },
                        { $expr: { $regexMatch: { input: { $toString: '$amount' }, regex: search } } },
                    ]
                }
            }] : []),

            { $sort: { date: -1 } },

            // Run count and paginated data in parallel
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    totalAmount: [{ $group: { _id: null, sum: { $sum: '$amount' } } }],
                    expenses: [
                        { $skip: offset },
                        { $limit: limit },
                    ]
                }
            }
        ];

        const [result] = await ExpenseList.aggregate(pipeline);

        const total = result.total[0]?.count || 0;
        const totalAmount = result.totalAmount[0]?.sum || 0;

        res.status(200).json({
            success: true,
            message: 'Expenses fetched successfully',
            expenses: result.expenses,
            totalAmount,
            pagination: {
                total,
                offset,
                limit,
                hasNextPage: offset + limit < total,
                hasPrevPage: offset > 0,
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch expenses', error: error.message });
    }
});

// Update expense
router.put('/update', async (req, res) => {
    try {
        const { expense_id, expense_category_id, amount, date, description } = req.body;

        if (!expense_id) {
            return res.status(400).json({ success: false, message: 'expense_id is required' });
        }

        const updatedExpense = await ExpenseList.findByIdAndUpdate(
            expense_id,
            { expense_category_id, amount, date, description },
            { new: true }  // fixed: was returnDocument which is a MongoDB driver option, not Mongoose
        );

        if (!updatedExpense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.status(200).json({ success: true, message: 'Expense updated successfully', expense: updatedExpense });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update expense', error: error.message });
    }
});

// Delete expense
router.delete('/delete', async (req, res) => {
    try {
        const { expense_id } = req.body;

        if (!expense_id) {
            return res.status(400).json({ success: false, message: 'expense_id is required' });
        }

        const deletedExpense = await ExpenseList.findByIdAndDelete(expense_id);

        if (!deletedExpense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.status(200).json({ success: true, message: 'Expense deleted successfully', expense: deletedExpense });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete expense', error: error.message });
    }
});

module.exports = router;