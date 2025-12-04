const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Updated user management routes for AI Chatbot Integration
// Provides user financial data context for personalized chatbot responses

// @route   GET /api/users/dashboard
// @desc    Get dashboard data (used by chatbot for context)
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const Account = require('../models/Account');
    const Expense = require('../models/Expense');
    const Income = require('../models/Income');

    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get accounts
    const accounts = await Account.find({ userId, isActive: true });

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    // Get monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get last month expenses for comparison
    const lastMonthExpenses = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get monthly income
    const monthlyIncome = await Income.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get last month income for comparison
    const lastMonthIncome = await Income.aggregate([
      { $match: { userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get yearly expenses
    const yearlyExpenses = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get yearly income
    const yearlyIncome = await Income.aggregate([
      { $match: { userId, date: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get recent transactions
    const recentExpenses = await Expense.find({ userId })
      .populate('categoryId', 'name color icon')
      .populate('accountId', 'name type')
      .sort({ date: -1 })
      .limit(5);

    const recentIncomes = await Income.find({ userId })
      .populate('categoryId', 'name color icon')
      .populate('accountId', 'name type')
      .sort({ date: -1 })
      .limit(5);

    const adjustedExpenses = recentExpenses.map(exp => {
      const obj = typeof exp.toObject === 'function' ? exp.toObject() : { ...exp };
      return { ...obj, amount: -Math.abs(obj.amount) };
    });

    const adjustedIncomes = recentIncomes.map(inc => {
      const obj = typeof inc.toObject === 'function' ? inc.toObject() : { ...inc };
      return { ...obj, amount: Math.abs(obj.amount) };
    });

    const recentTransactions = [...adjustedExpenses, ...adjustedIncomes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Calculate percentage changes
    const currentMonthExpenses = monthlyExpenses[0]?.total || 0;
    const prevMonthExpenses = lastMonthExpenses[0]?.total || 0;
    const expensesChange = prevMonthExpenses > 0 
      ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses * 100).toFixed(1)
      : 0;

    const currentMonthIncome = monthlyIncome[0]?.total || 0;
    const prevMonthIncome = lastMonthIncome[0]?.total || 0;
    const incomeChange = prevMonthIncome > 0 
      ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(1)
      : 0;

    const currentNet = currentMonthIncome - currentMonthExpenses;
    const prevNet = prevMonthIncome - prevMonthExpenses;
    const netChange = prevNet !== 0
      ? ((currentNet - prevNet) / Math.abs(prevNet) * 100).toFixed(1)
      : 0;

    res.json({
      totalBalance,
      // monthlyExpenses: currentMonthExpenses,
      // monthlyIncome: currentMonthIncome,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      monthlyIncome: monthlyIncome[0]?.total || 0,
      yearlyExpenses: yearlyExpenses[0]?.total || 0,
      yearlyIncome: yearlyIncome[0]?.total || 0,
      accounts: accounts.length,
      recentTransactions,
      // Percentage changes
      expensesChange: parseFloat(expensesChange),
      incomeChange: parseFloat(incomeChange),
      netChange: parseFloat(netChange),
      // Chatbot context data
      savingsRate: monthlyIncome[0]?.total ? 
        ((monthlyIncome[0].total - (monthlyExpenses[0]?.total || 0)) / monthlyIncome[0].total * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;