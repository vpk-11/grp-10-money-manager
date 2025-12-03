const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Account = require('../models/Account');
const User = require('../models/User');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => next());

const accountsRouter = require('../routes/accounts');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'], currency: 'USD' };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/accounts', (req, res, next) => attachUser(req, res, next), accountsRouter);

describe('Accounts API', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
  });

  describe('GET /api/accounts', () => {
    test('gets all active accounts for user', async () => {
      await Account.create([
        {
          userId: user._id,
          name: 'Checking',
          type: 'checking',
          balance: 1000,
          isActive: true
        },
        {
          userId: user._id,
          name: 'Savings',
          type: 'savings',
          balance: 5000,
          isActive: true
        },
        {
          userId: user._id,
          name: 'Old Account',
          type: 'checking',
          balance: 100,
          isActive: false
        }
      ]);

      const res = await request(app)
        .get('/api/accounts')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every(acc => acc.isActive)).toBe(true);
    });

    test('returns empty array when user has no accounts', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/accounts/:id', () => {
    test('gets single account by id', async () => {
      const account = await Account.create({
        userId: user._id,
        name: 'Checking',
        type: 'checking',
        balance: 1500
      });

      const res = await request(app)
        .get(`/api/accounts/${account._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Checking');
      expect(res.body.balance).toBe(1500);
    });

    test('returns 404 for non-existent account', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/accounts/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/accounts', () => {
    test('creates new account successfully', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'My Checking',
          type: 'checking',
          balance: 1000,
          description: 'Main checking account'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.account.name).toBe('My Checking');
      expect(res.body.account.type).toBe('checking');
      expect(res.body.account.balance).toBe(1000);

      const account = await Account.findById(res.body.account._id);
      expect(account).toBeDefined();
      expect(account.userId.toString()).toBe(user._id.toString());
    });

    test('creates account with default values', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Cash Account',
          type: 'cash',
          balance: 0
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.account.color).toBe('#3B82F6');
      expect(res.body.account.icon).toBe('wallet');
      expect(res.body.account.currency).toBe('USD');
    });

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('x-user-id', user._id.toString())
        .send({
          type: 'checking'
          // missing name and balance
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('validates account type enum', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Test Account',
          type: 'invalid_type',
          balance: 100
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates currency enum', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Test Account',
          type: 'checking',
          balance: 100,
          currency: 'INVALID'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    test('updates account successfully', async () => {
      const account = await Account.create({
        userId: user._id,
        name: 'Old Name',
        type: 'checking',
        balance: 1000
      });

      const res = await request(app)
        .put(`/api/accounts/${account._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Updated Name',
          balance: 1500,
          description: 'Updated description'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.account.name).toBe('Updated Name');
      expect(res.body.account.balance).toBe(1500);
      expect(res.body.account.description).toBe('Updated description');
    });

    test('validates update fields', async () => {
      const account = await Account.create({
        userId: user._id,
        name: 'Test Account',
        type: 'checking',
        balance: 1000
      });

      const res = await request(app)
        .put(`/api/accounts/${account._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          type: 'invalid_type'
        });

      expect(res.statusCode).toBe(400);
    });

    test('returns 404 for non-existent account', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/accounts/${fakeId}`)
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Updated'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    test('soft deletes account successfully', async () => {
      const account = await Account.create({
        userId: user._id,
        name: 'To Delete',
        type: 'checking',
        balance: 1000
      });

      const res = await request(app)
        .delete(`/api/accounts/${account._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);

      const deleted = await Account.findById(account._id);
      expect(deleted.isActive).toBe(false);
    });

    test('returns 404 for non-existent account', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/accounts/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });
});
