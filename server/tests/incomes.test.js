const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Income = require('../models/Income');
const Account = require('../models/Account');
const IncomeCategory = require('../models/IncomeCategory');
const User = require('../models/User');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => next());

const incomesRouter = require('../routes/incomes');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/incomes', (req, res, next) => attachUser(req, res, next), incomesRouter);

describe('Incomes API', () => {
  let user, account, category;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();

    account = new Account({
      userId: user._id,
      name: 'Checking',
      type: 'checking',
      balance: 1000
    });
    await account.save();

    category = new IncomeCategory({
      userId: user._id,
      name: 'Salary',
      icon: 'dollar-sign',
      color: '#10B981'
    });
    await category.save();
  });

  describe('POST /api/incomes', () => {
    test('creates income and updates account balance', async () => {
      const res = await request(app)
        .post('/api/incomes')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: account._id.toString(),
          categoryId: category._id.toString(),
          amount: 5000,
          description: 'Monthly Salary',
          date: new Date().toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.income.amount).toBe(5000);
      expect(res.body.income.description).toBe('Monthly Salary');
      expect(res.body.income.categoryId.name).toBe('Salary');

      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount.balance).toBe(6000); // 1000 + 5000
    });

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/incomes')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: account._id.toString()
          // missing categoryId, amount, description
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('validates account belongs to user', async () => {
      const otherUser = new User({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
      await otherUser.save();

      const otherAccount = new Account({
        userId: otherUser._id,
        name: 'Other Account',
        type: 'checking',
        balance: 1000
      });
      await otherAccount.save();

      const res = await request(app)
        .post('/api/incomes')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: otherAccount._id.toString(),
          categoryId: category._id.toString(),
          amount: 1000,
          description: 'Test'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('not found');
    });

    test('uses current date when date not provided', async () => {
      const before = new Date();

      const res = await request(app)
        .post('/api/incomes')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: account._id.toString(),
          categoryId: category._id.toString(),
          amount: 1000,
          description: 'Test Income'
        });

      expect(res.statusCode).toBe(201);
      const incomeDate = new Date(res.body.income.date);
      expect(incomeDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    test('accepts optional fields', async () => {
      const res = await request(app)
        .post('/api/incomes')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: account._id.toString(),
          categoryId: category._id.toString(),
          amount: 1000,
          description: 'Freelance Work',
          paymentMethod: 'bank_transfer',
          tags: ['freelance', 'project'],
          source: 'Client ABC',
          notes: 'Payment for web development'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.income.paymentMethod).toBe('bank_transfer');
      expect(res.body.income.tags).toEqual(['freelance', 'project']);
      expect(res.body.income.source).toBe('Client ABC');
      expect(res.body.income.notes).toBe('Payment for web development');
    });
  });

  describe('GET /api/incomes', () => {
    beforeEach(async () => {
      await Income.create([
        {
          userId: user._id,
          accountId: account._id,
          categoryId: category._id,
          amount: 5000,
          description: 'January Salary',
          date: new Date('2025-01-15')
        },
        {
          userId: user._id,
          accountId: account._id,
          categoryId: category._id,
          amount: 500,
          description: 'Bonus',
          date: new Date('2025-01-20')
        },
        {
          userId: user._id,
          accountId: account._id,
          categoryId: category._id,
          amount: 5000,
          description: 'February Salary',
          date: new Date('2025-02-15')
        }
      ]);
    });

    test('gets all incomes for user', async () => {
      const res = await request(app)
        .get('/api/incomes')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.incomes).toHaveLength(3);
      expect(res.body.total).toBe(3);
    });

    test('paginates incomes correctly', async () => {
      const res = await request(app)
        .get('/api/incomes?page=1&limit=2')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.incomes).toHaveLength(2);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.currentPage).toBe('1');
    });

    test('filters by date range', async () => {
      const res = await request(app)
        .get('/api/incomes?startDate=2025-01-01&endDate=2025-01-31')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.incomes).toHaveLength(2);
    });

    test('filters by category', async () => {
      const otherCategory = new IncomeCategory({
        userId: user._id,
        name: 'Investment',
        icon: 'chart-line',
        color: '#8B5CF6'
      });
      await otherCategory.save();

      await Income.create({
        userId: user._id,
        accountId: account._id,
        categoryId: otherCategory._id,
        amount: 1000,
        description: 'Dividend',
        date: new Date('2025-01-15')
      });

      const res = await request(app)
        .get(`/api/incomes?category=${category._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.incomes).toHaveLength(3);
      expect(res.body.incomes.every(i => i.categoryId._id.toString() === category._id.toString())).toBe(true);
    });

    test('sorts incomes by date descending by default', async () => {
      const res = await request(app)
        .get('/api/incomes')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      const dates = res.body.incomes.map(i => new Date(i.date));
      expect(dates[0] >= dates[1]).toBe(true);
      expect(dates[1] >= dates[2]).toBe(true);
    });

    test('sorts incomes by amount ascending', async () => {
      const res = await request(app)
        .get('/api/incomes?sortBy=amount&sortOrder=asc')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.incomes[0].amount).toBe(500);
    });
  });

  describe('GET /api/incomes/:id', () => {
    test('gets single income by id', async () => {
      const income = await Income.create({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 5000,
        description: 'Salary',
        date: new Date()
      });

      const res = await request(app)
        .get(`/api/incomes/${income._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.amount).toBe(5000);
      expect(res.body.description).toBe('Salary');
    });

    test('returns 404 for non-existent income', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/incomes/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/incomes/:id', () => {
    test('updates income and adjusts account balance', async () => {
      const income = await Income.create({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 5000,
        description: 'Salary',
        date: new Date()
      });

      // Account balance was already increased to 6000 by creation
      const beforeBalance = (await Account.findById(account._id)).balance;

      const res = await request(app)
        .put(`/api/incomes/${income._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          amount: 5500,
          description: 'Updated Salary'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.income.amount).toBe(5500);
      expect(res.body.income.description).toBe('Updated Salary');

      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount.balance).toBe(beforeBalance - 5000 + 5500);
    });

    test('updates income without changing amount', async () => {
      const income = await Income.create({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 5000,
        description: 'Salary',
        date: new Date()
      });

      const beforeBalance = (await Account.findById(account._id)).balance;

      const res = await request(app)
        .put(`/api/incomes/${income._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          description: 'Updated Description Only'
        });

      expect(res.statusCode).toBe(200);
      const afterBalance = (await Account.findById(account._id)).balance;
      expect(afterBalance).toBe(beforeBalance);
    });

    test('returns 404 for non-existent income', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/incomes/${fakeId}`)
        .set('x-user-id', user._id.toString())
        .send({
          amount: 5000
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/incomes/:id', () => {
    test('deletes income and adjusts account balance', async () => {
      const income = await Income.create({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 5000,
        description: 'Salary',
        date: new Date()
      });

      const beforeBalance = (await Account.findById(account._id)).balance;

      const res = await request(app)
        .delete(`/api/incomes/${income._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);

      const deleted = await Income.findById(income._id);
      expect(deleted).toBeNull();

      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount.balance).toBe(beforeBalance - 5000);
    });

    test('returns 404 for non-existent income', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/incomes/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });
});
