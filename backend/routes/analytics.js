const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

// GET analytics summary
router.get('/summary', async (req, res) => {
  try {
    // Total expenses
    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Expenses by category
    const categoryBreakdown = {};
    expenses.forEach(exp => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
    });
    
    // Monthly trend (last 6 months)
    const monthlyData = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    expenses.forEach(exp => {
      if (exp.date >= sixMonthsAgo) {
        const month = exp.date.toLocaleString('default', { month: 'short' });
        if (!monthlyData[month]) monthlyData[month] = 0;
        monthlyData[month] += exp.amount;
      }
    });
    
    // Total payments
    const payments = await Payment.find();
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
    
    res.json({
      totalExpenses,
      totalPayments,
      remainingBalance: totalExpenses - totalPayments,
      categoryBreakdown,
      monthlyTrend: monthlyData,
      expenseCount: expenses.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;