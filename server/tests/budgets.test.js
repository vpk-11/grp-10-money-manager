const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Account = require('../models/Account');
const User = require('../models/User');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => next());

const budgetsRouter = require('../routes/budgets');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/budgets', (req, res, next) => attachUser(req, res, next), budgetsRouter);

describe('Budgets API', () => {
  let user, category, account;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();

    category = new ExpenseCategory({
      userId: user._id,
      name: 'Food',
      icon: 'utensils',
      color: '#22c55e'
    });
    await category.save();

    account = new Account({
      userId: user._id,
      name: 'Cash',
      type: 'cash',
      balance: 1000
    });
    await account.save();
  });

  describe('POST /api/budgets', () => {
    test('creates monthly budget successfully', async () => {
      const startDate = new Date('2025-01-01');

      const res = await request(app)
        .post('/api/budgets')
        .set('x-user-id', user._id.toString())
        .send({
          categoryId: category._id.toString(),
          amount: 500,
          period: 'monthly',
          notes: 'Monthly food budget',
          startDate: startDate.toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.amount).toBe(500);
      expect(res.body.period).toBe('monthly');
      expect(res.body.spent).toBe(0);
      expect(res.body.remaining).toBe(500);
      expect(res.body.percentageUsed).toBe(0);
      expect(res.body.categoryId.name).toBe('Food');
    });

    test('creates weekly budget with correct end date', async () => {
      const startDate = new Date('2025-01-01');

      const res = await request(app)
        .post('/api/budgets')
        .set('x-user-id', user._id.toString())
        .send({
          categoryId: category._id.toString(),
          amount: 100,
          period: 'weekly',
          startDate: startDate.toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.period).toBe('weekly');
      
      const expectedEndDate = new Date('2025-01-08');
      expectedEndDate.setHours(23, 59, 59, 999);
      const actualEndDate = new Date(res.body.endDate);
      
      expect(actualEndDate.getTime()).toBeCloseTo(expectedEndDate.getTime(), -3);
    });

    test('creates yearly budget with correct end date', async () => {
      const startDate = new Date('2025-01-01');

      const res = await request(app)
        .post('/api/budgets')
        .set('x-user-id', user._id.toString())
        .send({
          categoryId: category._id.toString(),
          amount: 10000,
          period: 'yearly',
          startDate: startDate.toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.period).toBe('yearly');
      
      // End date should be roughly 1 year from start
      const actualEndDate = new Date(res.body.endDate);
      const startDateObj = new Date(res.body.startDate);
      
      expect(actualEndDate.getFullYear()).toBe(startDateObj.getFullYear() + 1);
    });

    test('uses current date as default start date', async () => {
      const before = new Date();
      
      const res = await request(app)
        .post('/api/budgets')
        .set('x-user-id', user._id.toString())
        .send({
          categoryId: category._id.toString(),
          amount: 500,
          period: 'monthly'
        });

      expect(res.statusCode).toBe(201);
      const startDate = new Date(res.body.startDate);
      expect(startDate.getTime()).toBeGreaterThanOrEqual(before.setHours(0, 0, 0, 0));
    });
  });

  describe('GET /api/budgets', () => {
    test('excludes expenses outside budget period', async () => {
      const startDate = new Date('2025-01-01');
      
      await Budget.create({
        userId: user._id,
        categoryId: category._id,
        amount: 500,
        period: 'monthly',
        startDate: startDate,
        endDate: new Date('2025-02-01')
      });

      // Create expense outside budget period
      await Expense.create({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 100,
        description: 'Old expense',
        date: new Date('2024-12-15')
      });

      const res = await request(app)
        .get('/api/budgets')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body[0].spent).toBe(0);
    });

    test('returns empty array when user has no budgets', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    test('only returns active budgets', async () => {
      await Budget.create([
        {
          userId: user._id,
          categoryId: category._id,
          amount: 500,
          period: 'monthly',
          isActive: true,
          startDate: new Date(),
          endDate: new Date()
        },
        {
          userId: user._id,
          categoryId: category._id,
          amount: 300,
          period: 'monthly',
          isActive: false,
          startDate: new Date(),
          endDate: new Date()
        }
      ]);

      const res = await request(app)
        .get('/api/budgets')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(500);
    });
  });

  describe('PUT /api/budgets/:id', () => {
    test('updates budget successfully', async () => {
      const budget = await Budget.create({
        userId: user._id,
        categoryId: category._id,
        amount: 500,
        period: 'monthly',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-01')
      });

      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          categoryId: category._id.toString(),
          amount: 600,
          period: 'monthly',
          notes: 'Updated budget',
          startDate: new Date('2025-01-01').toISOString()
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.amount).toBe(600);
      expect(res.body.notes).toBe('Updated budget');
    });

    test('recalculates end date on period change', async () => {
      const budget = await Budget.create({
        userId: user._id,
        categoryId: category._id,
        amount: 500,
        period: 'monthly',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-01')
      });

      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          categoryId: category._id.toString(),
          amount: 500,
          period: 'weekly',
          startDate: new Date('2025-01-01').toISOString()
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.period).toBe('weekly');
      
      const endDate = new Date(res.body.endDate);
      const startDate = new Date(res.body.startDate);
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(7, 0);
    });

    test('returns 404 for non-existent budget', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/budgets/${fakeId}`)
        .set('x-user-id', user._id.toString())
        .send({
          categoryId: category._id.toString(),
          amount: 600,
          period: 'monthly',
          startDate: new Date().toISOString()
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    test('deletes budget successfully', async () => {
      const budget = await Budget.create({
        userId: user._id,
        categoryId: category._id,
        amount: 500,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date()
      });

      const res = await request(app)
        .delete(`/api/budgets/${budget._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');

      const deleted = await Budget.findById(budget._id);
      expect(deleted).toBeNull();
    });

    test('returns 404 for non-existent budget', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/budgets/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });
});
