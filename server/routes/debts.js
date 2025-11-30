const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Debt = require('../models/Debt');
const User = require('../models/User');
const { sendDebtReminderEmail } = require('../utils/emailService');
const { createDebtDueSoonNotification } = require('../utils/notifications');

// Get all debts for user
router.get('/', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.user._id })
      .sort({ dueDate: 1, currentBalance: -1 });
    
    res.json(debts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({ message: 'Error fetching debts', error: error.message });
  }
});

// Get debt by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    
    res.json(debt);
  } catch (error) {
    console.error('Error fetching debt:', error);
    res.status(500).json({ message: 'Error fetching debt', error: error.message });
  }
});

// Create new debt
router.post('/',
  auth,
  [
    body('name').notEmpty().withMessage('Debt name is required'),
    body('type').isIn(['student_loan', 'credit_card', 'personal_loan', 'mortgage', 'auto_loan', 'medical', 'other']).withMessage('Invalid debt type'),
    body('principal').isFloat({ min: 0 }).withMessage('Principal must be a positive number'),
    body('currentBalance').isFloat({ min: 0 }).withMessage('Current balance must be a positive number'),
    body('interestRate').isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
    body('minimumPayment').isFloat({ min: 0 }).withMessage('Minimum payment must be a positive number'),
    body('dueDate').isInt({ min: 1, max: 31 }).withMessage('Due date must be between 1 and 31')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const debtData = {
        ...req.body,
        userId: req.user._id
      };
      
      // Calculate totalPaid based on principal and current balance
      // If currentBalance < principal, then totalPaid = principal - currentBalance
      if (!debtData.totalPaid && debtData.principal && debtData.currentBalance) {
        debtData.totalPaid = Math.max(0, debtData.principal - debtData.currentBalance);
      }
      
      const debt = new Debt(debtData);
      
      // Calculate estimated payoff date
      debt.estimatedPayoffDate = debt.calculateEstimatedPayoff();
      
      await debt.save();
      res.status(201).json(debt);
    } catch (error) {
      console.error('Error creating debt:', error);
      res.status(500).json({ message: 'Error creating debt', error: error.message });
    }
  }
);

// Update debt
router.put('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    
    const allowedUpdates = [
      'name', 'type', 'currentBalance', 'interestRate', 'minimumPayment',
      'dueDate', 'lender', 'accountNumber', 'status', 'reminderEnabled',
      'reminderDaysBefore', 'notes', 'color', 'totalPaid', 'lastPaymentDate', 'lastPaymentAmount'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        debt[field] = req.body[field];
      }
    });
    
    // Recalculate estimated payoff date
    debt.estimatedPayoffDate = debt.calculateEstimatedPayoff();
    
    await debt.save();
    res.json(debt);
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ message: 'Error updating debt', error: error.message });
  }
});

// Record a payment
router.post('/:id/payment',
  auth,
  [
    body('amount').isFloat({ min: 0 }).withMessage('Payment amount must be a positive number'),
    body('date').optional().isISO8601().withMessage('Invalid date format')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const debt = await Debt.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!debt) {
        return res.status(404).json({ message: 'Debt not found' });
      }
      
      const { amount, date } = req.body;
      const paymentAmount = parseFloat(amount);
      
      // Update debt
      debt.currentBalance = Math.max(0, debt.currentBalance - paymentAmount);
      debt.totalPaid += paymentAmount;
      debt.lastPaymentDate = date || new Date();
      debt.lastPaymentAmount = paymentAmount;
      
      // If paid off, update status
      if (debt.currentBalance === 0) {
        debt.status = 'paid_off';
        debt.payoffDate = new Date();
      }
      
      // Recalculate estimated payoff date
      debt.estimatedPayoffDate = debt.calculateEstimatedPayoff();
      
      await debt.save();
      res.json(debt);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ message: 'Error recording payment', error: error.message });
    }
  }
);

// Delete debt
router.delete('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    
    await debt.deleteOne();
    res.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    console.error('Error deleting debt:', error);
    res.status(500).json({ message: 'Error deleting debt', error: error.message });
  }
});

// Get payment reminders
router.get('/reminders/upcoming', auth, async (req, res) => {
  try {
    const debts = await Debt.find({
      userId: req.user._id,
      status: 'active',
      reminderEnabled: true
    });
    
    const today = new Date();
    const reminders = [];
    
    for (const debt of debts) {
      const nextPayment = debt.nextPaymentDate;
      if (!nextPayment) continue;
      
      const daysUntilDue = Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= debt.reminderDaysBefore && daysUntilDue >= 0) {
        reminders.push({
          debtId: debt._id,
          name: debt.name,
          type: debt.type,
          minimumPayment: debt.minimumPayment,
          dueDate: nextPayment,
          daysUntilDue,
          message: daysUntilDue === 0 
            ? `Payment due today for ${debt.name}!` 
            : `Payment for ${debt.name} due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
        });
      }
    }
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching payment reminders:', error);
    res.status(500).json({ message: 'Error fetching payment reminders', error: error.message });
  }
});

// Send debt reminders (for scheduled tasks or manual trigger)
router.post('/reminders/send', auth, async (req, res) => {
  try {
    const debts = await Debt.find({
      userId: req.user._id,
      status: 'active',
      reminderEnabled: true
    });
    
    const user = await User.findById(req.user._id);
    const today = new Date();
    const sentReminders = [];
    
    for (const debt of debts) {
      const nextPayment = debt.nextPaymentDate;
      if (!nextPayment) continue;
      
      const daysUntilDue = Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= debt.reminderDaysBefore && daysUntilDue >= 0) {
        // Create in-app notification
        await createDebtDueSoonNotification(
          req.user._id,
          debt.name,
          nextPayment.toLocaleDateString(),
          debt.minimumPayment,
          daysUntilDue
        );
        
        // Send email notification
        await sendDebtReminderEmail(
          user.email,
          user.name,
          debt.name,
          nextPayment.toLocaleDateString(),
          debt.minimumPayment
        );
        
        sentReminders.push({
          debtName: debt.name,
          dueDate: nextPayment,
          daysUntilDue
        });
      }
    }
    
    res.json({
      message: `Sent ${sentReminders.length} reminder(s)`,
      reminders: sentReminders
    });
  } catch (error) {
    console.error('Error sending debt reminders:', error);
    res.status(500).json({ message: 'Error sending debt reminders', error: error.message });
  }
});

// Get debt summary/analytics
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const debts = await Debt.find({
      userId: req.user._id,
      status: 'active'
    });
    
    const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalPrincipal = debts.reduce((sum, debt) => sum + debt.principal, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + debt.totalPaid, 0);
    const totalMonthlyPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    
    // Calculate weighted average interest rate
    const weightedInterest = debts.reduce((sum, debt) => {
      return sum + (debt.interestRate * debt.currentBalance);
    }, 0);
    const avgInterestRate = totalDebt > 0 ? weightedInterest / totalDebt : 0;
    
    // Group by type
    const debtByType = debts.reduce((acc, debt) => {
      if (!acc[debt.type]) {
        acc[debt.type] = {
          count: 0,
          totalBalance: 0,
          totalMinPayment: 0
        };
      }
      acc[debt.type].count++;
      acc[debt.type].totalBalance += debt.currentBalance;
      acc[debt.type].totalMinPayment += debt.minimumPayment;
      return acc;
    }, {});
    
    res.json({
      totalDebt,
      totalPrincipal,
      totalPaid,
      totalMonthlyPayment,
      avgInterestRate: avgInterestRate.toFixed(2),
      debtCount: debts.length,
      debtByType,
      percentagePaidOff: totalPrincipal > 0 ? ((totalPrincipal - totalDebt) / totalPrincipal * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching debt analytics:', error);
    res.status(500).json({ message: 'Error fetching debt analytics', error: error.message });
  }
});

module.exports = router;
