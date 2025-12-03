const request = require('supertest');
const express = require('express');
const Account = require('../models/Account');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const ExpenseCategory = require('../models/ExpenseCategory');
const IncomeCategory = require('../models/IncomeCategory');
const User = require('../models/User');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => next());

const usersRouter = require('../routes/users');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/users', (req, res, next) => attachUser(req, res, next), usersRouter);

describe('Users API', () => {
  let user, account, expenseCategory, incomeCategory;

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
      balance: 5000
    });
    await account.save();

    expenseCategory = new ExpenseCategory({
      userId: user._id,
      name: 'Food',
      icon: 'utensils',
      color: '#22c55e'
    });
    await expenseCategory.save();

    incomeCategory = new IncomeCategory({
      userId: user._id,
      name: 'Salary',
      icon: 'dollar-sign',
      color: '#10B981'
    });
    await incomeCategory.save();
  });

  describe('GET /api/users/dashboard', () => {
    test('returns dashboard data with financial summary', async () => {
      const res = await request(app)
        .get('/api/users/dashboard')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalBalance');
      expect(res.body).toHaveProperty('monthlyExpenses');
      expect(res.body).toHaveProperty('monthlyIncome');
      expect(res.body).toHaveProperty('yearlyExpenses');
      expect(res.body).toHaveProperty('yearlyIncome');
      expect(res.body).toHaveProperty('accounts');
      expect(res.body).toHaveProperty('recentTransactions');
      expect(res.body).toHaveProperty('savingsRate');
    });

    test('calculates total balance correctly', async () => {
      await Account.create({
        userId: user._id,
        name: 'Savings',
        type: 'savings',
        balance: 3000
      });

      const res = await request(app)
        .get('/api/users/dashboard')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.totalBalance).toBe(8000); // 5000 + 3000
    });

    test('returns 0 savings rate when no income', async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);

      await Expense.create({
        userId: user._id,
        accountId: account._id,
        categoryId: expenseCategory._id,
        amount: 1000,
        description: 'Expense',
        date: thisMonth
      });

      const res = await request(app)
        .get('/api/users/dashboard')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.savingsRate).toBe(0);
    });

    test('returns recent transactions sorted by date', async () => {
      const now = new Date();

      await Expense.create({
        userId: user._id,
        accountId: account._id,
        categoryId: expenseCategory._id,
        amount: 100,
        description: 'Expense 1',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      });

      await Income.create({
        userId: user._id,
        accountId: account._id,
        categoryId: incomeCategory._id,
        amount: 1000,
        description: 'Income 1',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      });

      const res = await request(app)
        .get('/api/users/dashboard')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.recentTransactions.length).toBeGreaterThan(0);
      
      // Verify sorted by date descending
      const dates = res.body.recentTransactions.map(t => new Date(t.date));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i] >= dates[i + 1]).toBe(true);
      }
    });

    test('limits recent transactions to 10', async () => {
      const now = new Date();

      // Create 7 expenses and 5 incomes (12 total)
      for (let i = 0; i < 7; i++) {
        await Expense.create({
          userId: user._id,
          accountId: account._id,
          categoryId: expenseCategory._id,
          amount: 100,
          description: `Expense ${i}`,
          date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        });
      }

      for (let i = 0; i < 5; i++) {
        await Income.create({
          userId: user._id,
          accountId: account._id,
          categoryId: incomeCategory._id,
          amount: 500,
          description: `Income ${i}`,
          date: new Date(now.getTime() - (i + 7) * 24 * 60 * 60 * 1000)
        });
      }

      const res = await request(app)
        .get('/api/users/dashboard')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.recentTransactions.length).toBeLessThanOrEqual(10);
      expect(res.body.recentTransactions.length).toBeGreaterThan(0);
    });

    test('returns correct account count', async () => {
      await Account.create([
        {
          userId: user._id,
          name: 'Savings',
          type: 'savings',
          balance: 2000,
          isActive: true
        },
        {
          userId: user._id,
          name: 'Inactive',
          type: 'cash',
          balance: 100,
          isActive: false
        }
      ]);

      const res = await request(app)
        .get('/api/users/dashboard')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.accounts).toBe(2); // All accounts, active and inactive
    });

    test('returns zero values when no transactions exist', async () => {
      const res = await request(app)
        .get('/api/users/dashboard')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.monthlyExpenses).toBe(0);
      expect(res.body.monthlyIncome).toBe(0);
      expect(res.body.yearlyExpenses).toBe(0);
      expect(res.body.yearlyIncome).toBe(0);
      expect(res.body.savingsRate).toBe(0);
      expect(res.body.recentTransactions).toHaveLength(0);
    });
  });
});
