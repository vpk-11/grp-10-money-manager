const express = require('express');
const { body, validationResult } = require('express-validator');
const ExpenseCategory = require('../models/ExpenseCategory');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/expense-categories
// @desc    Get all expense categories for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ 
      userId: req.user._id, 
      isActive: true 
    }).sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    console.error('Get expense categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expense-categories/:id
// @desc    Get single expense category
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await ExpenseCategory.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get expense category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expense-categories
// @desc    Create new expense category
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Category name is required'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('icon').optional().isString().withMessage('Icon must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color, icon, parentCategory, budgetLimit, budgetPeriod } = req.body;

    const category = new ExpenseCategory({
      userId: req.user._id,
      name,
      description,
      color: color || '#3B82F6',
      icon: icon || 'shopping-cart',
      parentCategory,
      budgetLimit,
      budgetPeriod: budgetPeriod || 'monthly'
    });

    await category.save();

    res.status(201).json({
      message: 'Expense category created successfully',
      category
    });
  } catch (error) {
    console.error('Create expense category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expense-categories/:id
// @desc    Update expense category
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be between 1 and 50 characters'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Expense category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update expense category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expense-categories/:id
// @desc    Delete expense category (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Expense category deleted successfully' });
  } catch (error) {
    console.error('Delete expense category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;