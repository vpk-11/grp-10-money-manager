const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Debt name is required'],
    trim: true,
    maxlength: [100, 'Debt name cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['student_loan', 'credit_card', 'personal_loan', 'mortgage', 'auto_loan', 'medical', 'other'],
    required: true
  },
  principal: {
    type: Number,
    required: [true, 'Principal amount is required'],
    min: [0, 'Principal cannot be negative']
  },
  currentBalance: {
    type: Number,
    required: true,
    min: [0, 'Current balance cannot be negative']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  minimumPayment: {
    type: Number,
    required: [true, 'Minimum payment is required'],
    min: [0, 'Minimum payment cannot be negative']
  },
  dueDate: {
    type: Number, // Day of the month (1-31)
    required: [true, 'Due date is required'],
    min: [1, 'Due date must be between 1 and 31'],
    max: [31, 'Due date must be between 1 and 31']
  },
  startDate: {
    type: Date,
    required: true
  },
  payoffDate: {
    type: Date
  },
  estimatedPayoffDate: {
    type: Date
  },
  lender: {
    type: String,
    trim: true,
    maxlength: [100, 'Lender name cannot be more than 100 characters']
  },
  accountNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Account number cannot be more than 50 characters']
  },
  status: {
    type: String,
    enum: ['active', 'paid_off', 'defaulted', 'deferred'],
    default: 'active'
  },
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderDaysBefore: {
    type: Number,
    default: 3,
    min: [0, 'Reminder days cannot be negative']
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number,
    min: [0, 'Payment amount cannot be negative']
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  color: {
    type: String,
    default: '#EF4444' // Default red color
  }
}, {
  timestamps: true
});

// Index for efficient queries
debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ userId: 1, dueDate: 1 });

// Virtual for total interest paid
debtSchema.virtual('totalInterestPaid').get(function() {
  return Math.max(0, this.totalPaid - (this.principal - this.currentBalance));
});

// Virtual for percentage paid off
debtSchema.virtual('percentagePaidOff').get(function() {
  return this.principal > 0 ? ((this.principal - this.currentBalance) / this.principal) * 100 : 0;
});

// Virtual for next payment date
debtSchema.virtual('nextPaymentDate').get(function() {
  if (this.status !== 'active') return null;
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  
  let nextMonth = currentMonth;
  let nextYear = currentYear;
  
  if (currentDay >= this.dueDate) {
    nextMonth = currentMonth + 1;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear = currentYear + 1;
    }
  }
  
  return new Date(nextYear, nextMonth, this.dueDate);
});

// Calculate estimated payoff date based on minimum payments
debtSchema.methods.calculateEstimatedPayoff = function() {
  if (this.currentBalance === 0) return new Date();
  
  const monthlyRate = this.interestRate / 100 / 12;
  let balance = this.currentBalance;
  let months = 0;
  const maxMonths = 600; // Cap at 50 years
  
  while (balance > 0 && months < maxMonths) {
    const interest = balance * monthlyRate;
    const principal = Math.min(this.minimumPayment - interest, balance);
    
    if (principal <= 0) {
      // Minimum payment doesn't cover interest
      return null;
    }
    
    balance -= principal;
    months++;
  }
  
  const estimatedDate = new Date();
  estimatedDate.setMonth(estimatedDate.getMonth() + months);
  return estimatedDate;
};

// Ensure virtuals are included in JSON
debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Debt', debtSchema);
