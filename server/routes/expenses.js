const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

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

module.exports = router;
