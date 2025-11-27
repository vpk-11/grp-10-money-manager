const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
jest.mock('../middleware/auth', () => (req, res, next) => next());
const debtsRouter = require('../routes/debts');
const User = require('../models/User');

// Attach user via header since routes read req.user._id
function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

// Patch router to bypass real auth
const app = express();
app.use(express.json());
// Replace actual auth with stub by mounting router under a custom path
app.use('/api/debts', (req, res, next) => attachUser(req, res, next), debtsRouter);

describe('Debts API', () => {
  let user;

  beforeEach(async () => {
    user = new User({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    await user.save();
  });

  test('creates a debt and initializes totalPaid', async () => {
    const res = await request(app)
      .post('/api/debts')
      .set('x-user-id', user._id.toString())
      .send({
        name: 'Credit Card',
        type: 'credit_card',
        principal: 1000,
        currentBalance: 800,
        interestRate: 18,
        minimumPayment: 50,
        dueDate: 25,
        startDate: new Date().toISOString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.totalPaid).toBe(200);
    expect(res.body.currentBalance).toBe(800);
  });

  test('records a payment and updates totalPaid and status', async () => {
    // Create debt first
    const create = await request(app)
      .post('/api/debts')
      .set('x-user-id', user._id.toString())
      .send({
        name: 'Loan',
        type: 'personal_loan',
        principal: 500,
        currentBalance: 500,
        interestRate: 10,
        minimumPayment: 50,
        dueDate: 10,
        startDate: new Date().toISOString(),
      });
    const debtId = create.body._id;

    const pay = await request(app)
      .post(`/api/debts/${debtId}/payment`)
      .set('x-user-id', user._id.toString())
      .send({ amount: 200 });

    expect(pay.statusCode).toBe(200);
    expect(pay.body.currentBalance).toBe(300);
    expect(pay.body.totalPaid).toBe(200);
    expect(pay.body.status).toBe('active');

    // Pay remaining
    const payOff = await request(app)
      .post(`/api/debts/${debtId}/payment`)
      .set('x-user-id', user._id.toString())
      .send({ amount: 300 });

    expect(payOff.statusCode).toBe(200);
    expect(payOff.body.currentBalance).toBe(0);
    expect(payOff.body.totalPaid).toBe(500);
    expect(payOff.body.status).toBe('paid_off');
    expect(payOff.body.payoffDate).toBeTruthy();
  });
});