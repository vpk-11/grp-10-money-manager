const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createBudgetExceededNotification, createBudgetWarningNotification } = require('../utils/notifications');
const { sendBudgetExceededEmail } = require('../utils/emailService');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get all expenses for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, account, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    const query = { userId: req.user._id };
    
    if (category) query.categoryId = category;
    if (account) query.accountId = account;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(query)
      .populate('categoryId', 'name color icon')
      .populate('accountId', 'name type')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
    .populate('categoryId', 'name color icon')
    .populate('accountId', 'name type');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', auth, [
  body('accountId').isMongoId().withMessage('Valid account ID is required'),
  body('categoryId').isMongoId().withMessage('Valid category ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Description is required'),
  body('date').optional().isISO8601().withMessage('Date must be valid'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'bank_transfer', 'digital_wallet', 'check', 'other']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountId, categoryId, amount, description, date, paymentMethod, tags, location, notes } = req.body;

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(400).json({ message: 'Account not found' });
    }

    const expense = new Expense({
      userId: req.user._id,
      accountId,
      categoryId,
      amount,
      description,
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      tags,
      location,
      notes
    });

    await expense.save();

    // Update account balance
    account.balance -= amount;
    await account.save();

    // Check budget and create notifications if needed
    try {
      await checkBudgetAndNotify(req.user._id, categoryId, amount);
    } catch (budgetError) {
      console.error('Budget check error:', budgetError);
      // Don't fail the expense creation if budget check fails
    }

    const populatedExpense = await Expense.findById(expense._id)
      .populate('categoryId', 'name color icon')
      .populate('accountId', 'name type');

    res.status(201).json({
      message: 'Expense created successfully',
      expense: populatedExpense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', auth, [
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('description').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Description must be between 1 and 200 characters'),
  body('date').optional().isISO8601().withMessage('Date must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // If amount is being updated, adjust account balance
    if (req.body.amount && req.body.amount !== expense.amount) {
      const account = await Account.findById(expense.accountId);
      if (account) {
        account.balance = account.balance + expense.amount - req.body.amount;
        await account.save();
      }
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name color icon')
     .populate('accountId', 'name type');

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Restore account balance
    const account = await Account.findById(expense.accountId);
    if (account) {
      account.balance += expense.amount;
      await account.save();
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check budget and send notifications
async function checkBudgetAndNotify(userId, categoryId, newExpenseAmount) {
  try {
    // Find active budget for this category
    const budget = await Budget.findOne({
      userId,
      categoryId,
      isActive: true
    }).populate('categoryId', 'name');

    if (!budget) return; // No budget set for this category

    // Calculate date range for budget period
    const start = new Date(budget.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(budget.startDate);
    if (budget.period === 'weekly') end.setDate(end.getDate() + 7);
    else if (budget.period === 'yearly') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    end.setHours(23, 59, 59, 999);

    // Calculate total spent in this budget period
    const spentResult = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          categoryId: new mongoose.Types.ObjectId(categoryId),
          date: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: null, spent: { $sum: '$amount' } } }
    ]);

    const totalSpent = spentResult[0]?.spent || 0;
    const percentage = (totalSpent / budget.amount) * 100;

    const user = await User.findById(userId);
    const categoryName = budget.categoryId.name;

    // Budget exceeded (100%)
    if (totalSpent > budget.amount) {
      await createBudgetExceededNotification(
        userId,
        categoryName,
        budget.amount,
        totalSpent
      );

      await sendBudgetExceededEmail(
        user.email,
        user.name,
        categoryName,
        budget.amount,
        totalSpent
      );
    }
    // Budget warning (80% threshold)
    else if (percentage >= 80 && percentage < 100) {
      await createBudgetWarningNotification(
        userId,
        categoryName,
        budget.amount,
        totalSpent
      );
    }
  } catch (error) {
    console.error('Check budget error:', error);
    throw error;
  }
}

module.exports = router;
