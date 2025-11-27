const express = require('express');
const { body, validationResult } = require('express-validator');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/accounts
// @desc    Get all accounts for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user._id, isActive: true })
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/accounts/:id
// @desc    Get single account
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/accounts
// @desc    Create new account
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Account name is required'),
  body('type').isIn(['checking', 'savings', 'credit', 'investment', 'cash', 'other']).withMessage('Invalid account type'),
  body('balance').isNumeric().withMessage('Balance must be a number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR']).withMessage('Invalid currency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, balance, currency, description, color, icon } = req.body;

    const account = new Account({
      userId: req.user._id,
      name,
      type,
      balance: balance || 0,
      currency: currency || req.user.currency,
      description,
      color: color || '#3B82F6',
      icon: icon || 'wallet'
    });

    await account.save();

    res.status(201).json({
      message: 'Account successfully created',
      account
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/accounts/:id
// @desc    Update account
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Account name must be between 1 and 50 characters'),
  body('type').optional().isIn(['checking', 'savings', 'credit', 'investment', 'cash', 'other']).withMessage('Invalid account type'),
  body('balance').optional().isNumeric().withMessage('Balance must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete account (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ message: 'Account successfully deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
