const request = require('supertest');
const express = require('express');
jest.mock('../middleware/auth', () => (req, res, next) => next());
const expensesRouter = require('../routes/expenses');
const accountsRouter = require('../routes/accounts');
const Account = require('../models/Account');
const User = require('../models/User');
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
});