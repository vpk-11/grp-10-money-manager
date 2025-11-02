const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    required: true,
    default: 'shopping-cart'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    default: null
  },
  budgetLimit: {
    type: Number,
    min: [0, 'Budget limit cannot be negative']
  },
  budgetPeriod: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  }
}, {
  timestamps: true
});

// Index for efficient queries
expenseCategorySchema.index({ userId: 1, isActive: 1 });
expenseCategorySchema.index({ userId: 1, isDefault: 1 });

// Ensure only one default category per user
expenseCategorySchema.pre('save', async function(next) {
  if (this.isDefault && this.isNew) {
    await this.constructor.updateMany(
      { userId: this.userId, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);