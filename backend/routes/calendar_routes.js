// routes/calendar.js
const express = require('express');
const router = express.Router();
const expenseList = require('../models/expense_list');
const incomeList = require('../models/income_list');
const authMiddleware = require('../middleware/auth'); // adjust path if needed

/**
 * GET /api/calendar/monthly
 * Query params:
 *   user_id  — required
 *   year     — e.g. 2026  (defaults to current year)
 *   month    — 1-12       (defaults to current month)
 *
 * Response:
 * {
 *   year, month,
 *   days: [
 *     { date: "2026-05-01", expense: 320, income: 0, expenseCount: 2, incomeCount: 0 },
 *     ...
 *   ],
 *   summary: {
 *     totalExpense, totalIncome,
 *     avgExpensePerDay, avgIncomePerDay,
 *     mostExpensiveDay: { date, amount },
 *     mostIncomeDay:    { date, amount },
 *     activeDays, daysInMonth
 *   }
 * }
 */
router.get('/monthly', async (req, res) => {
    try {
        const { user_id, year, month } = req.query;

        if (!user_id) {
            return res.status(400).json({ message: 'user_id is required' });
        }

        const now = new Date();
        const y = parseInt(year) || now.getFullYear();
        const m = parseInt(month) || now.getMonth() + 1; // 1-based

        if (m < 1 || m > 12) {
            return res.status(400).json({ message: 'month must be between 1 and 12' });
        }

        // Build date range — start of month to start of next month (UTC)
        const startDate = new Date(Date.UTC(y, m - 1, 1));
        const endDate = new Date(Date.UTC(y, m, 1));       // exclusive

        // ── Aggregate expenses by day ──
        const expenseAgg = await expenseList.aggregate([
            {
                $match: {
                    user_id,
                    date: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' },
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // ── Aggregate income by day ──
        const incomeAgg = await incomeList.aggregate([
            {
                $match: {
                    user_id,
                    date: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' },
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // ── Build lookup maps ──
        const expenseMap = {};
        expenseAgg.forEach(e => { expenseMap[e._id] = { total: e.total, count: e.count }; });

        const incomeMap = {};
        incomeAgg.forEach(e => { incomeMap[e._id] = { total: e.total, count: e.count }; });

        // ── Build per-day array for the whole month ──
        const daysInMonth = new Date(y, m, 0).getDate(); // e.g. 31 for May
        const days = [];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                expense: expenseMap[dateStr]?.total ?? 0,
                income: incomeMap[dateStr]?.total ?? 0,
                expenseCount: expenseMap[dateStr]?.count ?? 0,
                incomeCount: incomeMap[dateStr]?.count ?? 0,
            });
        }

        // ── Summary calculations ──
        const totalExpense = days.reduce((s, d) => s + d.expense, 0);
        const totalIncome = days.reduce((s, d) => s + d.income, 0);

        // Active days = days that had at least one transaction
        const activeDays = days.filter(d => d.expense > 0 || d.income > 0).length;

        // Elapsed days — for current month: today's date, for past months: full month
        const nowUTC = new Date()
        const isCurrentMonth = (y === nowUTC.getUTCFullYear() && m === nowUTC.getUTCMonth() + 1)
        const elapsedDays = isCurrentMonth
            ? nowUTC.getUTCDate()   // e.g. 14 if today is 14th
            : daysInMonth           // full month for past months

        const avgExpensePerDay = elapsedDays > 0
            ? parseFloat((totalExpense / elapsedDays).toFixed(2))
            : 0;
        const avgIncomePerDay = elapsedDays > 0
            ? parseFloat((totalIncome / elapsedDays).toFixed(2))
            : 0;

        // Most expensive / highest income day
        let mostExpensiveDay = null;
        let mostIncomeDay = null;

        days.forEach(d => {
            if (d.expense > 0 && (!mostExpensiveDay || d.expense > mostExpensiveDay.amount)) {
                mostExpensiveDay = { date: d.date, amount: d.expense };
            }
            if (d.income > 0 && (!mostIncomeDay || d.income > mostIncomeDay.amount)) {
                mostIncomeDay = { date: d.date, amount: d.income };
            }
        });

        return res.json({
            year: y,
            month: m,
            days,
            summary: {
                totalExpense,
                totalIncome,
                avgExpensePerDay,
                avgIncomePerDay,
                mostExpensiveDay,
                mostIncomeDay,
                activeDays,
                daysInMonth,
                elapsedDays,
            },
        });
    } catch (err) {
        console.error('Calendar monthly error:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;