const request = require('supertest');
const express = require('express');
jest.mock('../middleware/auth', () => (req, res, next) => next());
const expensesRouter = require('../routes/expenses');
const accountsRouter = require('../routes/accounts');
const Account = require('../models/Account');
const User = require('../models/User');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/expenses', (req, res, next) => attachUser(req, res, next), expensesRouter);
app.use('/api/accounts', (req, res, next) => attachUser(req, res, next), accountsRouter);

describe('Expenses API', () => {
  let user, account, category;

  beforeEach(async () => {
    user = new User({ name: 'User', email: 'user@example.com', password: 'secret123' });
    await user.save();
    account = new Account({ userId: user._id, name: 'Cash', type: 'cash', balance: 1000 });
    await account.save();
    category = new ExpenseCategory({ userId: user._id, name: 'Groceries', icon: 'shopping-cart', color: '#22c55e' });
    await category.save();
  });

  describe('GET /api/expenses', () => {
    test('gets all expenses for user', async () => {
      const expense1 = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 100,
        description: 'Groceries',
        date: new Date()
      });
      const expense2 = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 50,
        description: 'Gas',
        date: new Date()
      });
      await expense1.save();
      await expense2.save();

      const res = await request(app)
        .get('/api/expenses')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.expenses.length).toBe(2);
      expect(res.body.total).toBe(2);
    });

    test('paginates expenses correctly', async () => {
      for (let i = 0; i < 25; i++) {
        const expense = new Expense({
          userId: user._id,
          accountId: account._id,
          categoryId: category._id,
          amount: 10 * (i + 1),
          description: `Expense ${i + 1}`,
          date: new Date(Date.now() - i * 86400000)
        });
        await expense.save();
      }

      const res = await request(app)
        .get('/api/expenses?page=1&limit=20')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.expenses.length).toBe(20);
      expect(res.body.totalPages).toBe(2);
    });

    test('filters expenses by category', async () => {
      const cat2 = new ExpenseCategory({ userId: user._id, name: 'Gas', color: '#3b82f6' });
      await cat2.save();

      const exp1 = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 100,
        description: 'Groceries',
        date: new Date()
      });
      const exp2 = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: cat2._id,
        amount: 50,
        description: 'Fuel',
        date: new Date()
      });
      await exp1.save();
      await exp2.save();

      const res = await request(app)
        .get(`/api/expenses?category=${category._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.expenses.length).toBe(1);
    });

    test('filters expenses by date range', async () => {
      const todayDate = new Date();

      const expToday = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 200,
        description: 'Today',
        date: todayDate
      });
      await expToday.save();

      const startDate = new Date(todayDate);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date(todayDate);
      endDate.setDate(endDate.getDate() + 1);

      const res = await request(app)
        .get(`/api/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.expenses.length).toBe(1);
    });

    test('sorts expenses by amount ascending', async () => {
      const exp1 = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 100,
        description: 'High',
        date: new Date()
      });
      const exp2 = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 50,
        description: 'Low',
        date: new Date()
      });
      await exp1.save();
      await exp2.save();

      const res = await request(app)
        .get('/api/expenses?sortBy=amount&sortOrder=asc')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.expenses[0].amount).toBe(50);
      expect(res.body.expenses[1].amount).toBe(100);
    });

    test('returns empty array when user has no expenses', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.expenses.length).toBe(0);
    });
  });

  describe('GET /api/expenses/:id', () => {
    test('gets single expense by id', async () => {
      const expense = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 75,
        description: 'Lunch',
        date: new Date()
      });
      await expense.save();

      const res = await request(app)
        .get(`/api/expenses/${expense._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.amount).toBe(75);
      expect(res.body.description).toBe('Lunch');
    });

    test('returns 404 for non-existent expense', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/expenses/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Expense not found');
    });
  });

  describe('POST /api/expenses', () => {
    test('creates an expense and updates account balance', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: account._id.toString(),
          categoryId: category._id.toString(),
          amount: 100,
          description: 'Groceries',
          date: new Date().toISOString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.expense.amount).toBe(100);

      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount.balance).toBe(900);
    });

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('x-user-id', user._id.toString())
        .send({
          amount: 100
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('validates account belongs to user', async () => {
      const otherUser = new User({ name: 'Other', email: 'other@example.com', password: 'password123' });
      await otherUser.save();
      const otherAccount = new Account({ userId: otherUser._id, name: 'Other Account', type: 'cash', balance: 500 });
      await otherAccount.save();

      const res = await request(app)
        .post('/api/expenses')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: otherAccount._id.toString(),
          categoryId: category._id.toString(),
          amount: 50,
          description: 'Test'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Account not found');
    });

    test('accepts optional fields', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: account._id.toString(),
          categoryId: category._id.toString(),
          amount: 50,
          description: 'Test',
          paymentMethod: 'card',
          tags: ['food', 'sale'],
          location: 'Walmart'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.expense.paymentMethod).toBe('card');
      expect(res.body.expense.tags).toContain('food');
      expect(res.body.expense.location).toBe('Walmart');
    });

    test('uses current date when date not provided', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('x-user-id', user._id.toString())
        .send({
          accountId: account._id.toString(),
          categoryId: category._id.toString(),
          amount: 30,
          description: 'No date'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.expense.date).toBeDefined();
    });
  });

  describe('PUT /api/expenses/:id', () => {
    test('updates expense successfully', async () => {
      const expense = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 100,
        description: 'Old description',
        date: new Date()
      });
      await expense.save();

      const res = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          amount: 150,
          description: 'Updated'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.expense.amount).toBe(150);
      expect(res.body.expense.description).toBe('Updated');
    });

    test('adjusts account balance when amount changes', async () => {
      const expense = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 100,
        description: 'Test',
        date: new Date()
      });
      await expense.save();
      const initialBalance = (await Account.findById(account._id)).balance;

      const res = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set('x-user-id', user._id.toString())
        .send({ amount: 150 });

      expect(res.statusCode).toBe(200);
      expect(res.body.expense.amount).toBe(150);
      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount.balance).toBe(initialBalance - 50); // Extra 50 deducted
    });

    test('returns 404 for non-existent expense', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/expenses/${fakeId}`)
        .set('x-user-id', user._id.toString())
        .send({ description: 'Updated' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    test('deletes expense and adjusts account balance', async () => {
      const expense = new Expense({
        userId: user._id,
        accountId: account._id,
        categoryId: category._id,
        amount: 100,
        description: 'To delete',
        date: new Date()
      });
      await expense.save();

      const balanceBefore = (await Account.findById(account._id)).balance;

      const res = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);

      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount.balance).toBe(balanceBefore + 100); // Refunded
    });

    test('returns 404 for non-existent expense', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/expenses/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });
});
