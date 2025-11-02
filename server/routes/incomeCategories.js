const express = require('express');
const { body, validationResult } = require('express-validator');
const IncomeCategory = require('../models/IncomeCategory');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/income-categories
// @desc    Get all income categories for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await IncomeCategory.find({ 
      userId: req.user._id, 
      isActive: true 
    }).sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    console.error('Get income categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/income-categories/:id
// @desc    Get single income category
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await IncomeCategory.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get income category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/income-categories
// @desc    Create new income category
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

    const { name, description, color, icon, parentCategory } = req.body;

    const category = new IncomeCategory({
      userId: req.user._id,
      name,
      description,
      color: color || '#10B981',
      icon: icon || 'dollar-sign',
      parentCategory
    });

    await category.save();

    res.status(201).json({
      message: 'Income category created successfully',
      category
    });
  } catch (error) {
    console.error('Create income category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/income-categories/:id
// @desc    Update income category
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

    const category = await IncomeCategory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Income category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update income category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/income-categories/:id
// @desc    Delete income category (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await IncomeCategory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Income category deleted successfully' });
  } catch (error) {
    console.error('Delete income category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;