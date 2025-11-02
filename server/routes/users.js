const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/dashboard
// @desc    Get dashboard data
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

    // Get accounts
    const accounts = await Account.find({ userId, isActive: true });

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    // Get monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get monthly income
    const monthlyIncome = await Income.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
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

    const recentTransactions = [...recentExpenses, ...recentIncomes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      totalBalance,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      monthlyIncome: monthlyIncome[0]?.total || 0,
      yearlyExpenses: yearlyExpenses[0]?.total || 0,
      yearlyIncome: yearlyIncome[0]?.total || 0,
      accounts: accounts.length,
      recentTransactions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;