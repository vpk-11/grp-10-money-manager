const express = require('express');
const { body, validationResult } = require('express-validator');
const Income = require('../models/Income');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/incomes
// @desc    Get all incomes for user
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

    const incomes = await Income.find(query)
      .populate('categoryId', 'name color icon')
      .populate('accountId', 'name type')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Income.countDocuments(query);

    res.json({
      incomes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/incomes/:id
// @desc    Get single income
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
    .populate('categoryId', 'name color icon')
    .populate('accountId', 'name type');

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    res.json(income);
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/incomes
// @desc    Create new income
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

    const { accountId, categoryId, amount, description, date, paymentMethod, tags, source, notes } = req.body;

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(400).json({ message: 'Account not found' });
    }

    const income = new Income({
      userId: req.user._id,
      accountId,
      categoryId,
      amount,
      description,
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      tags,
      source,
      notes
    });

    await income.save();

    // Update account balance
    account.balance += amount;
    await account.save();

    const populatedIncome = await Income.findById(income._id)
      .populate('categoryId', 'name color icon')
      .populate('accountId', 'name type');

    res.status(201).json({
      message: 'Income created successfully',
      income: populatedIncome
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/incomes/:id
// @desc    Update income
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

    const income = await Income.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    // If amount is being updated, adjust account balance
    if (req.body.amount && req.body.amount !== income.amount) {
      const account = await Account.findById(income.accountId);
      if (account) {
        account.balance = account.balance - income.amount + req.body.amount;
        await account.save();
      }
    }

    const updatedIncome = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name color icon')
     .populate('accountId', 'name type');

    res.json({
      message: 'Income updated successfully',
      income: updatedIncome
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/incomes/:id
// @desc    Delete income
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    // Adjust account balance
    const account = await Account.findById(income.accountId);
    if (account) {
      account.balance -= income.amount;
      await account.save();
    }

    await Income.findByIdAndDelete(req.params.id);

    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
