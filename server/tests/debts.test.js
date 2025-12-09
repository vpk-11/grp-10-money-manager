const request = require('supertest');
const express = require('express');
jest.mock('../middleware/auth', () => (req, res, next) => next());
const debtsRouter = require('../routes/debts');
const User = require('../models/User');
const Debt = require('../models/Debt');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/debts', (req, res, next) => attachUser(req, res, next), debtsRouter);

describe('Debts API', () => {
  let user;

  beforeEach(async () => {
    user = new User({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    await user.save();
  });

  describe('GET /api/debts', () => {
    test('gets all debts for user', async () => {
      const debt1 = new Debt({
        userId: user._id,
        name: 'Card 1',
        type: 'credit_card',
        principal: 1000,
        currentBalance: 800,
        interestRate: 18,
        minimumPayment: 50,
        dueDate: 15,
        startDate: new Date()
      });
      const debt2 = new Debt({
        userId: user._id,
        name: 'Loan',
        type: 'personal_loan',
        principal: 5000,
        currentBalance: 4000,
        interestRate: 10,
        minimumPayment: 200,
        dueDate: 25,
        startDate: new Date()
      });
      await debt1.save();
      await debt2.save();

      const res = await request(app)
        .get('/api/debts')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
    });

    test('returns empty array when user has no debts', async () => {
      const res = await request(app)
        .get('/api/debts')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /api/debts/:id', () => {
    test('gets single debt by id', async () => {
      const debt = new Debt({
        userId: user._id,
        name: 'Student Loan',
        type: 'student_loan',
        principal: 20000,
        currentBalance: 18000,
        interestRate: 5,
        minimumPayment: 150,
        dueDate: 1,
        startDate: new Date()
      });
      await debt.save();

      const res = await request(app)
        .get(`/api/debts/${debt._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Student Loan');
    });

    test('returns 404 for non-existent debt', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/debts/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Debt not found');
    });
  });

  describe('POST /api/debts', () => {
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

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/debts')
        .set('x-user-id', user._id.toString())
        .send({
          type: 'credit_card',
          principal: 1000
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('validates debt type enum', async () => {
      const res = await request(app)
        .post('/api/debts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Invalid',
          type: 'invalid_type',
          principal: 1000,
          currentBalance: 900,
          interestRate: 10,
          minimumPayment: 50,
          dueDate: 15
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates principal is positive', async () => {
      const res = await request(app)
        .post('/api/debts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Debt',
          type: 'credit_card',
          principal: -100,
          currentBalance: 50,
          interestRate: 10,
          minimumPayment: 50,
          dueDate: 15
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates interest rate range', async () => {
      const res = await request(app)
        .post('/api/debts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Debt',
          type: 'credit_card',
          principal: 1000,
          currentBalance: 900,
          interestRate: 150,
          minimumPayment: 50,
          dueDate: 15
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates due date is 1-31', async () => {
      const res = await request(app)
        .post('/api/debts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Debt',
          type: 'credit_card',
          principal: 1000,
          currentBalance: 900,
          interestRate: 10,
          minimumPayment: 50,
          dueDate: 35
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/debts/:id', () => {
    test('updates debt successfully', async () => {
      const debt = new Debt({
        userId: user._id,
        name: 'Card',
        type: 'credit_card',
        principal: 1000,
        currentBalance: 800,
        interestRate: 18,
        minimumPayment: 50,
        dueDate: 15,
        startDate: new Date()
      });
      await debt.save();

      const res = await request(app)
        .put(`/api/debts/${debt._id}`)
        .set('x-user-id', user._id.toString())
        .send({ name: 'Updated Card', minimumPayment: 75 });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Card');
      expect(res.body.minimumPayment).toBe(75);
    });

    test('returns 404 for non-existent debt', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/debts/${fakeId}`)
        .set('x-user-id', user._id.toString())
        .send({ name: 'Updated' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/debts/:id', () => {
    test('deletes debt successfully', async () => {
      const debt = new Debt({
        userId: user._id,
        name: 'Card',
        type: 'credit_card',
        principal: 1000,
        currentBalance: 800,
        interestRate: 18,
        minimumPayment: 50,
        dueDate: 15,
        startDate: new Date()
      });
      await debt.save();

      const res = await request(app)
        .delete(`/api/debts/${debt._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);

      const check = await Debt.findById(debt._id);
      expect(check).toBeNull();
    });

    test('returns 404 for non-existent debt', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/debts/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/debts/:id/payment', () => {
    test('records a payment and updates totalPaid and status', async () => {
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
    });

    test('pays off debt completely', async () => {
      const create = await request(app)
        .post('/api/debts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Small Loan',
          type: 'personal_loan',
          principal: 300,
          currentBalance: 300,
          interestRate: 10,
          minimumPayment: 50,
          dueDate: 10,
          startDate: new Date().toISOString(),
        });
      const debtId = create.body._id;

      const payOff = await request(app)
        .post(`/api/debts/${debtId}/payment`)
        .set('x-user-id', user._id.toString())
        .send({ amount: 300 });

      expect(payOff.statusCode).toBe(200);
      expect(payOff.body.currentBalance).toBe(0);
      expect(payOff.body.totalPaid).toBe(300);
      expect(payOff.body.status).toBe('paid_off');
    });

    test('validates payment amount is positive', async () => {
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

      const res = await request(app)
        .post(`/api/debts/${debtId}/payment`)
        .set('x-user-id', user._id.toString())
        .send({ amount: -100 });

      expect(res.statusCode).toBe(400);
    });

    test('returns 404 when debt not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/debts/${fakeId}/payment`)
        .set('x-user-id', user._id.toString())
        .send({ amount: 100 });

      expect(res.statusCode).toBe(404);
    });
  });
});
