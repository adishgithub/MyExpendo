const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const IncomeList = require('../models/income_list');

// Create income
router.post('/create', async (req, res) => {
    try {
        const { user_id, income_category_id, amount, date, description } = req.body;

        if (!user_id || !amount || !date) {
            return res.status(400).json({ success: false, message: 'user_id, amount and date are required' });
        }

        const newIncome = await IncomeList.create({
            income_id: uuidv4(),
            user_id,
            income_category_id,
            amount,
            date,
            description,
        });

        res.status(201).json({ success: true, message: 'Income created successfully', income: newIncome });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create income', error: error.message });
    }
});

// List incomes
router.get('/list', async (req, res) => {
    try {
        const {
            user_id,
            from_date, to_date,
            income_category_id,
            search,
        } = req.query;

        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 20;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }

        // ── Stage 1: match ──────────────────────────────────────────────
        const matchStage = { user_id };

        if (income_category_id) {
            matchStage.income_category_id = income_category_id;
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

            // Join category collection
            {
                $lookup: {
                    from: 'income_category_lists',  // MongoDB collection name
                    localField: 'income_category_id',
                    foreignField: 'income_category_id',
                    as: 'category',
                }
            },

            // Flatten the joined array
            {
                $addFields: {
                    income_category_name: { $arrayElemAt: ['$category.income_category_name', 0] }
                }
            },

            // Remove raw joined array
            { $project: { category: 0, __v: 0 } },

            // Search across description, category name, amount
            ...(search ? [{
                $match: {
                    $or: [
                        { description: { $regex: search, $options: 'i' } },
                        { income_category_name: { $regex: search, $options: 'i' } },
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
                    incomes: [
                        { $skip: offset },
                        { $limit: limit },
                    ]
                }
            }
        ];

        const [result] = await IncomeList.aggregate(pipeline);

        const total = result.total[0]?.count || 0;
        const totalAmount = result.totalAmount[0]?.sum || 0;

        res.status(200).json({
            success: true,
            message: 'Incomes fetched successfully',
            incomes: result.incomes,
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
        res.status(500).json({ success: false, message: 'Failed to fetch incomes', error: error.message });
    }
});

// Update income
router.put('/update', async (req, res) => {
    try {
        const { income_id, income_category_id, amount, date, description } = req.body;

        if (!income_id) {
            return res.status(400).json({ success: false, message: 'income_id is required' });
        }

        const updatedIncome = await IncomeList.findByIdAndUpdate(
            income_id,
            { income_category_id, amount, date, description },
            { new: true }
        );

        if (!updatedIncome) {
            return res.status(404).json({ success: false, message: 'Income not found' });
        }

        res.status(200).json({ success: true, message: 'Income updated successfully', income: updatedIncome });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update income', error: error.message });
    }
});

// Delete income
router.delete('/delete', async (req, res) => {
    try {
        const { income_id } = req.body;

        if (!income_id) {
            return res.status(400).json({ success: false, message: 'income_id is required' });
        }

        const deletedIncome = await IncomeList.findByIdAndDelete(income_id);

        if (!deletedIncome) {
            return res.status(404).json({ success: false, message: 'Income not found' });
        }

        res.status(200).json({ success: true, message: 'Income deleted successfully', income: deletedIncome });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete income', error: error.message });
    }
});

module.exports = router;