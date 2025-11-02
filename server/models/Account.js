const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [50, 'Account name cannot be more than 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Account type is required'],
    enum: ['checking', 'savings', 'credit', 'investment', 'cash', 'other']
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  icon: {
    type: String,
    default: 'wallet'
  }
}, {
  timestamps: true
});

// Index for efficient queries
accountSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Account', accountSchema);
