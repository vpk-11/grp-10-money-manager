const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// UPDATE budget by ID
router.put('/:id', auth, async (req, res) => {
  try {
    const { categoryId, amount, period, notes, startDate } = req.body;
    const endDate = new Date(startDate);
    if (period === 'weekly') endDate.setDate(endDate.getDate() + 7);
    else if (period === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);
    endDate.setHours(23, 59, 59, 999);

    const updated = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { categoryId, amount, period, notes, startDate, endDate },
      { new: true }
    ).populate('categoryId', 'name color icon');

    if (!updated) return res.status(404).json({ message: 'Budget not found' });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
});

// DELETE budget by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id, isActive: true })
      .populate('categoryId', 'name color icon');

    const result = await Promise.all(budgets.map(async (budget) => {
      // FORCE correct date range — THIS IS THE FIX
      const start = new Date(budget.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(budget.startDate);
      if (budget.period === 'weekly') end.setDate(end.getDate() + 7);
      else if (budget.period === 'yearly') end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1); // monthly
      end.setHours(23, 59, 59, 999);

      const spentResult = await Expense.aggregate([
        {
          $match: {
            userId: req.user._id,
            categoryId: new mongoose.Types.ObjectId(budget.categoryId._id || budget.categoryId),
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, spent: { $sum: '$amount' } } }
      ]);

      const spent = spentResult[0]?.spent || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget.toObject({ virtuals: true }),
        spent,
        remaining: Math.max(0, budget.amount - spent),
        percentageUsed: percentage
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Budget fetch error:', err);
    res.status(500).json({ message: 'Error' });
  }
});

// CREATE — FIXED endDate
router.post('/', auth, async (req, res) => {
  try {
    const { categoryId, amount, period = 'monthly', notes = '', startDate: startDateRaw } = req.body;

    let startDate = startDateRaw ? new Date(startDateRaw) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    if (period === 'weekly') endDate.setDate(endDate.getDate() + 7);
    else if (period === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);
    endDate.setHours(23, 59, 59, 999);

    const budget = new Budget({
      userId: req.user._id,
      categoryId,
      amount: parseFloat(amount),
      period,
      notes,
      startDate,
      endDate
    });

    await budget.save();
    await budget.populate('categoryId', 'name color icon');

    const obj = budget.toObject({ virtuals: true });
    obj.spent = 0;
    obj.remaining = obj.amount;
    obj.percentageUsed = 0;

    res.status(201).json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Create failed' });
  }
});

module.exports = router;

// DEBUG ROUTE — NO AUTH, WORKS ON PORT 5001
router.get('/debug', async (req, res) => {
  try {
    const budgets = await Budget.find().populate('categoryId', 'name');
    const expenses = await Expense.find().sort({ date: -1 }).limit(30);

    res.json({
      message: "DEBUG MODE — NO AUTH",
      totalBudgets: budgets.length,
      totalExpenses: expenses.length,
      budgets: budgets,
      recentExpenses: expenses.map(e => ({
        amount: e.amount,
        categoryId: e.categoryId,
        date: e.date,
        description: e.description
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});