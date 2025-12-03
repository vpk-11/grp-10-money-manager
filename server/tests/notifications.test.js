const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const {
  createNotification,
  createBudgetExceededNotification,
  createBudgetWarningNotification,
  createDebtDueSoonNotification,
  createDebtOverdueNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications
} = require('../utils/notifications');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => next());

// Mock email service
jest.mock('../utils/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

const notificationsRouter = require('../routes/notifications');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/notifications', (req, res, next) => attachUser(req, res, next), notificationsRouter);

describe('Notifications API Routes', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await Notification.create([
        {
          userId: user._id,
          type: 'budget_exceeded',
          title: 'Budget Exceeded',
          message: 'You exceeded your budget',
          priority: 'high',
          isRead: false
        },
        {
          userId: user._id,
          type: 'debt_due_soon',
          title: 'Payment Due',
          message: 'Payment is due soon',
          priority: 'medium',
          isRead: true
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Welcome',
          message: 'Welcome to Money Manager',
          priority: 'low',
          isRead: false
        }
      ]);
    });

    test('gets all notifications for user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(3);
      expect(res.body.total).toBe(3);
      expect(res.body.unreadCount).toBe(2);
    });

    test('gets only unread notifications when filtered', async () => {
      const res = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(2);
      expect(res.body.notifications.every(n => !n.isRead)).toBe(true);
    });

    test('paginates notifications correctly', async () => {
      const res = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toHaveLength(2);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBe(2);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    test('returns correct unread count', async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: 'Test 1',
          message: 'Message 1',
          isRead: false
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 2',
          message: 'Message 2',
          isRead: false
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 3',
          message: 'Message 3',
          isRead: true
        }
      ]);

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    test('marks notification as read', async () => {
      const notification = await Notification.create({
        userId: user._id,
        type: 'system',
        title: 'Test',
        message: 'Test message',
        isRead: false
      });

      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.notification.isRead).toBe(true);

      const updated = await Notification.findById(notification._id);
      expect(updated.isRead).toBe(true);
    });

    test('returns 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    test('marks all notifications as read', async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: 'Test 1',
          message: 'Message 1',
          isRead: false
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 2',
          message: 'Message 2',
          isRead: false
        }
      ]);

      const res = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);

      const notifications = await Notification.find({ userId: user._id });
      expect(notifications.every(n => n.isRead)).toBe(true);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    test('deletes notification successfully', async () => {
      const notification = await Notification.create({
        userId: user._id,
        type: 'system',
        title: 'Test',
        message: 'Test message'
      });

      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);

      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });

    test('returns 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/notifications', () => {
    test('deletes all read notifications', async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: 'Test 1',
          message: 'Message 1',
          isRead: true
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 2',
          message: 'Message 2',
          isRead: true
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 3',
          message: 'Message 3',
          isRead: false
        }
      ]);

      const res = await request(app)
        .delete('/api/notifications')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);

      const remaining = await Notification.find({ userId: user._id });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].isRead).toBe(false);
    });
  });
});

describe('Notification Utility Functions', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
  });

  describe('createNotification', () => {
    test('creates a basic notification', async () => {
      const notification = await createNotification(
        user._id,
        'system',
        'Test Title',
        'Test Message',
        { sendEmail: false }
      );

      expect(notification).toBeDefined();
      expect(notification.userId.toString()).toBe(user._id.toString());
      expect(notification.type).toBe('system');
      expect(notification.title).toBe('Test Title');
      expect(notification.message).toBe('Test Message');
      expect(notification.priority).toBe('medium');
      expect(notification.isRead).toBe(false);
    });

    test('creates notification with custom options', async () => {
      const notification = await createNotification(
        user._id,
        'budget_exceeded',
        'Budget Alert',
        'Budget exceeded',
        {
          priority: 'high',
          icon: 'warning',
          actionUrl: '/budgets',
          metadata: { categoryName: 'Food', amount: 500 },
          sendEmail: false
        }
      );

      expect(notification.priority).toBe('high');
      expect(notification.icon).toBe('warning');
      expect(notification.actionUrl).toBe('/budgets');
      expect(notification.metadata.categoryName).toBe('Food');
      expect(notification.metadata.amount).toBe(500);
    });
  });

  describe('createBudgetExceededNotification', () => {
    test('creates budget exceeded notification with correct details', async () => {
      const notification = await createBudgetExceededNotification(
        user._id,
        'Food',
        500,
        650
      );

      expect(notification.type).toBe('budget_exceeded');
      expect(notification.priority).toBe('high');
      expect(notification.icon).toBe('warning');
      expect(notification.message).toContain('Food');
      expect(notification.message).toContain('150.00');
      expect(notification.metadata.categoryName).toBe('Food');
      expect(notification.metadata.budgetAmount).toBe(500);
      expect(notification.metadata.spentAmount).toBe(650);
    });
  });

  describe('createBudgetWarningNotification', () => {
    test('creates budget warning notification at 80% threshold', async () => {
      const notification = await createBudgetWarningNotification(
        user._id,
        'Transportation',
        1000,
        800
      );

      expect(notification.type).toBe('budget_warning');
      expect(notification.priority).toBe('medium');
      expect(notification.icon).toBe('alert');
      expect(notification.message).toContain('Transportation');
      expect(notification.message).toContain('80.0%');
      expect(notification.message).toContain('200.00');
      expect(notification.metadata.remaining).toBe('200.00');
    });
  });

  describe('createDebtDueSoonNotification', () => {
    test('creates debt due soon notification with correct urgency', async () => {
      const dueDate = new Date();
      const notification = await createDebtDueSoonNotification(
        user._id,
        'Credit Card',
        dueDate,
        250,
        3
      );

      expect(notification.type).toBe('debt_due_soon');
      expect(notification.priority).toBe('high');
      expect(notification.icon).toBe('alert');
      expect(notification.message).toContain('Credit Card');
      expect(notification.message).toContain('250');
      expect(notification.message).toContain('3 days');
    });

    test('sets urgent priority for debt due in 1 day', async () => {
      const dueDate = new Date();
      const notification = await createDebtDueSoonNotification(
        user._id,
        'Loan',
        dueDate,
        1000,
        1
      );

      expect(notification.priority).toBe('urgent');
      expect(notification.message).toContain('1 day');
    });
  });

  describe('createDebtOverdueNotification', () => {
    test('creates debt overdue notification with urgent priority', async () => {
      const notification = await createDebtOverdueNotification(
        user._id,
        'Mortgage',
        1500,
        5
      );

      expect(notification.type).toBe('debt_overdue');
      expect(notification.priority).toBe('urgent');
      expect(notification.icon).toBe('error');
      expect(notification.message).toContain('Mortgage');
      expect(notification.message).toContain('1500');
      expect(notification.message).toContain('5 days');
      expect(notification.message).toContain('overdue');
    });
  });

  describe('getUnreadCount', () => {
    test('returns correct count of unread notifications', async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: 'Test 1',
          message: 'Message 1',
          isRead: false
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 2',
          message: 'Message 2',
          isRead: false
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 3',
          message: 'Message 3',
          isRead: true
        }
      ]);

      const count = await getUnreadCount(user._id);
      expect(count).toBe(2);
    });

    test('returns 0 when no unread notifications exist', async () => {
      const count = await getUnreadCount(user._id);
      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    test('marks specific notification as read', async () => {
      const notification = await Notification.create({
        userId: user._id,
        type: 'system',
        title: 'Test',
        message: 'Test message',
        isRead: false
      });

      const updated = await markAsRead(notification._id, user._id);
      expect(updated.isRead).toBe(true);
    });

    test('returns null for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await markAsRead(fakeId, user._id);
      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    test('marks all user notifications as read', async () => {
      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: 'Test 1',
          message: 'Message 1',
          isRead: false
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Test 2',
          message: 'Message 2',
          isRead: false
        }
      ]);

      await markAllAsRead(user._id);

      const notifications = await Notification.find({ userId: user._id });
      expect(notifications.every(n => n.isRead)).toBe(true);
    });
  });

  describe('deleteOldNotifications', () => {
    test('deletes notifications older than 30 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);

      await Notification.create([
        {
          userId: user._id,
          type: 'system',
          title: 'Old Notification',
          message: 'This is old',
          createdAt: oldDate
        },
        {
          userId: user._id,
          type: 'system',
          title: 'Recent Notification',
          message: 'This is recent',
          createdAt: recentDate
        }
      ]);

      await deleteOldNotifications();

      const remaining = await Notification.find({ userId: user._id });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].title).toBe('Recent Notification');
    });
  });
});

describe('Notification Model', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
  });

  test('creates notification with required fields', async () => {
    const notification = new Notification({
      userId: user._id,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test message'
    });

    await notification.save();
    expect(notification._id).toBeDefined();
    expect(notification.priority).toBe('medium');
    expect(notification.isRead).toBe(false);
    expect(notification.icon).toBe('info');
  });

  test('validates notification type enum', async () => {
    const notification = new Notification({
      userId: user._id,
      type: 'invalid_type',
      title: 'Test',
      message: 'Test message'
    });

    await expect(notification.save()).rejects.toThrow();
  });

  test('validates priority enum', async () => {
    const notification = new Notification({
      userId: user._id,
      type: 'system',
      title: 'Test',
      message: 'Test message',
      priority: 'invalid_priority'
    });

    await expect(notification.save()).rejects.toThrow();
  });

  test('validates title max length', async () => {
    const notification = new Notification({
      userId: user._id,
      type: 'system',
      title: 'a'.repeat(101),
      message: 'Test message'
    });

    await expect(notification.save()).rejects.toThrow();
  });

  test('validates message max length', async () => {
    const notification = new Notification({
      userId: user._id,
      type: 'system',
      title: 'Test',
      message: 'a'.repeat(501)
    });

    await expect(notification.save()).rejects.toThrow();
  });

  test('stores metadata as mixed type', async () => {
    const notification = new Notification({
      userId: user._id,
      type: 'budget_exceeded',
      title: 'Budget Alert',
      message: 'Budget exceeded',
      metadata: {
        categoryName: 'Food',
        amount: 500,
        percentage: 120,
        nested: { value: 'test' }
      }
    });

    await notification.save();
    expect(notification.metadata.categoryName).toBe('Food');
    expect(notification.metadata.amount).toBe(500);
    expect(notification.metadata.nested.value).toBe('test');
  });

  test('has timestamps', async () => {
    const notification = new Notification({
      userId: user._id,
      type: 'system',
      title: 'Test',
      message: 'Test message'
    });

    await notification.save();
    expect(notification.createdAt).toBeDefined();
    expect(notification.updatedAt).toBeDefined();
  });
});
