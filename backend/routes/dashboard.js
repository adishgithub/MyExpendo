const express = require('express');
const router = express.Router();
const ExpenseList = require('../models/expense_list');
const IncomeList = require('../models/income_list');
const ToBuyList = require('../models/to_buy_list');

router.get('/', async (req, res) => {
    try {
        const { user_id, from_date, to_date } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'user_id is required' });

        const now = new Date();

        // Use custom range or default to current month
        const rangeStart = from_date
            ? new Date(from_date + 'T00:00:00.000Z')
            : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))

        const rangeEnd = to_date
            ? new Date(new Date(to_date + 'T00:00:00.000Z').getTime() + (24 * 60 * 60 * 1000) - 1)
            : new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1) - 1)

        // Always last 6 months for trend
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [
            expenseSummary, incomeSummary,
            expenseByCategory, incomeByCategory,
            recentExpenses, recentIncomes,
            toBuySummary, monthlyExpenses, monthlyIncomes,
        ] = await Promise.all([

            ExpenseList.aggregate([
                { $match: { user_id, date: { $gte: rangeStart, $lte: rangeEnd } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),

            IncomeList.aggregate([
                { $match: { user_id, date: { $gte: rangeStart, $lte: rangeEnd } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),

            ExpenseList.aggregate([
                { $match: { user_id, date: { $gte: rangeStart, $lte: rangeEnd } } },
                { $lookup: { from: 'expense_category_lists', localField: 'expense_category_id', foreignField: 'expense_category_id', as: 'cat' } },
                { $addFields: { cat_name: { $ifNull: [{ $arrayElemAt: ['$cat.expense_category_name', 0] }, 'Uncategorised'] } } },
                { $group: { _id: '$cat_name', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } }, { $limit: 6 }
            ]),

            IncomeList.aggregate([
                { $match: { user_id, date: { $gte: rangeStart, $lte: rangeEnd } } },
                { $lookup: { from: 'income_category_lists', localField: 'income_category_id', foreignField: 'income_category_id', as: 'cat' } },
                { $addFields: { cat_name: { $ifNull: [{ $arrayElemAt: ['$cat.income_category_name', 0] }, 'Uncategorised'] } } },
                { $group: { _id: '$cat_name', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } }, { $limit: 6 }
            ]),

            ExpenseList.aggregate([
                { $match: { user_id, date: { $gte: rangeStart, $lte: rangeEnd } } },
                { $lookup: { from: 'expense_category_lists', localField: 'expense_category_id', foreignField: 'expense_category_id', as: 'cat' } },
                { $addFields: { expense_category_name: { $ifNull: [{ $arrayElemAt: ['$cat.expense_category_name', 0] }, 'Uncategorised'] } } },
                { $project: { cat: 0, __v: 0 } },
                { $sort: { date: -1 } }, { $limit: 5 }
            ]),

            IncomeList.aggregate([
                { $match: { user_id, date: { $gte: rangeStart, $lte: rangeEnd } } },
                { $lookup: { from: 'income_category_lists', localField: 'income_category_id', foreignField: 'income_category_id', as: 'cat' } },
                { $addFields: { income_category_name: { $ifNull: [{ $arrayElemAt: ['$cat.income_category_name', 0] }, 'Uncategorised'] } } },
                { $project: { cat: 0, __v: 0 } },
                { $sort: { date: -1 } }, { $limit: 5 }
            ]),

            ToBuyList.aggregate([
                { $match: { user_id } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            // Always 6 months for trend regardless of filter
            ExpenseList.aggregate([
                { $match: { user_id, date: { $gte: sixMonthsAgo } } },
                { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            IncomeList.aggregate([
                { $match: { user_id, date: { $gte: sixMonthsAgo } } },
                { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
        ]);

        const totalExpenses = expenseSummary[0]?.total || 0;
        const totalIncome = incomeSummary[0]?.total || 0;
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

        const toBuyCount = toBuySummary.reduce((acc, s) => {
            acc[s._id?.toLowerCase() || 'unknown'] = s.count;
            acc.total = (acc.total || 0) + s.count;
            return acc;
        }, {});

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'short' }) });
        }

        const monthlyTrend = months.map(m => {
            const exp = monthlyExpenses.find(e => e._id.year === m.year && e._id.month === m.month);
            const inc = monthlyIncomes.find(e => e._id.year === m.year && e._id.month === m.month);
            return {
                label: m.label,
                expenses: exp?.total || 0,
                income: inc?.total || 0,
                savings: (inc?.total || 0) - (exp?.total || 0),
            };
        });
        console.log('expenseSummary:', expenseSummary)

        res.status(200).json({
            success: true,
            data: {
                totalExpenses, totalIncome, netSavings, savingsRate,
                expenseByCategory, incomeByCategory,
                recentExpenses, recentIncomes,
                toBuyCount, monthlyTrend,
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error.message });
    }
});

module.exports = router;