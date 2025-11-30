const Notification = require('../models/Notification');

// Create a notification
const createNotification = async (userId, type, title, message, options = {}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      priority: options.priority || 'medium',
      metadata: options.metadata || {},
      actionUrl: options.actionUrl || '',
      icon: options.icon || 'info'
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Create budget exceeded notification
const createBudgetExceededNotification = async (userId, categoryName, budgetAmount, spentAmount) => {
  const exceededBy = (spentAmount - budgetAmount).toFixed(2);
  const percentage = ((spentAmount / budgetAmount) * 100).toFixed(1);

  return await createNotification(
    userId,
    'budget_exceeded',
    'Budget Exceeded',
    `You've exceeded your ${categoryName} budget by $${exceededBy} (${percentage}%)`,
    {
      priority: 'high',
      icon: 'warning',
      actionUrl: '/budgets',
      metadata: {
        categoryName,
        budgetAmount,
        spentAmount,
        exceededBy
      }
    }
  );
};

// Create budget warning notification (80% threshold)
const createBudgetWarningNotification = async (userId, categoryName, budgetAmount, spentAmount) => {
  const percentage = ((spentAmount / budgetAmount) * 100).toFixed(1);
  const remaining = (budgetAmount - spentAmount).toFixed(2);

  return await createNotification(
    userId,
    'budget_warning',
    'Budget Warning',
    `You've used ${percentage}% of your ${categoryName} budget. $${remaining} remaining.`,
    {
      priority: 'medium',
      icon: 'alert',
      actionUrl: '/budgets',
      metadata: {
        categoryName,
        budgetAmount,
        spentAmount,
        remaining
      }
    }
  );
};

// Create debt due soon notification
const createDebtDueSoonNotification = async (userId, debtName, dueDate, amount, daysUntilDue) => {
  return await createNotification(
    userId,
    'debt_due_soon',
    'Payment Due Soon',
    `Your ${debtName} payment of $${amount} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
    {
      priority: daysUntilDue <= 1 ? 'urgent' : 'high',
      icon: 'alert',
      actionUrl: '/debts',
      metadata: {
        debtName,
        dueDate,
        amount,
        daysUntilDue
      }
    }
  );
};

// Create debt overdue notification
const createDebtOverdueNotification = async (userId, debtName, amount, daysOverdue) => {
  return await createNotification(
    userId,
    'debt_overdue',
    'Payment Overdue',
    `Your ${debtName} payment of $${amount} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue!`,
    {
      priority: 'urgent',
      icon: 'error',
      actionUrl: '/debts',
      metadata: {
        debtName,
        amount,
        daysOverdue
      }
    }
  );
};

// Get unread notification count
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ userId, isRead: false });
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

// Delete old notifications (older than 30 days)
const deleteOldNotifications = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
};

module.exports = {
  createNotification,
  createBudgetExceededNotification,
  createBudgetWarningNotification,
  createDebtDueSoonNotification,
  createDebtOverdueNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications
};
