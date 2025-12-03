const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const IncomeCategory = require('../models/IncomeCategory');
const User = require('../models/User');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => next());

const incomeCategoriesRouter = require('../routes/incomeCategories');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/income-categories', (req, res, next) => attachUser(req, res, next), incomeCategoriesRouter);

describe('Income Categories API', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
  });

  describe('GET /api/income-categories', () => {
    test('gets all active income categories for user', async () => {
      await IncomeCategory.create([
        {
          userId: user._id,
          name: 'Salary',
          icon: 'dollar-sign',
          color: '#10B981',
          isActive: true
        },
        {
          userId: user._id,
          name: 'Freelance',
          icon: 'briefcase',
          color: '#8B5CF6',
          isActive: true
        },
        {
          userId: user._id,
          name: 'Old Category',
          icon: 'archive',
          color: '#666666',
          isActive: false
        }
      ]);

      const res = await request(app)
        .get('/api/income-categories')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every(cat => cat.isActive)).toBe(true);
    });

    test('sorts categories by name', async () => {
      await IncomeCategory.create([
        { userId: user._id, name: 'Zulu Income', icon: 'z', color: '#000000' },
        { userId: user._id, name: 'Alpha Income', icon: 'a', color: '#111111' },
        { userId: user._id, name: 'Bravo Income', icon: 'b', color: '#222222' }
      ]);

      const res = await request(app)
        .get('/api/income-categories')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body[0].name).toBe('Alpha Income');
      expect(res.body[1].name).toBe('Bravo Income');
      expect(res.body[2].name).toBe('Zulu Income');
    });

    test('returns empty array when user has no categories', async () => {
      const res = await request(app)
        .get('/api/income-categories')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/income-categories/:id', () => {
    test('gets single income category by id', async () => {
      const category = await IncomeCategory.create({
        userId: user._id,
        name: 'Salary',
        description: 'Monthly salary',
        icon: 'dollar-sign',
        color: '#10B981'
      });

      const res = await request(app)
        .get(`/api/income-categories/${category._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Salary');
      expect(res.body.description).toBe('Monthly salary');
    });

    test('returns 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/income-categories/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/income-categories', () => {
    test('creates income category successfully', async () => {
      const res = await request(app)
        .post('/api/income-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Investment',
          description: 'Investment returns',
          color: '#F59E0B',
          icon: 'chart-line'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.category.name).toBe('Investment');
      expect(res.body.category.description).toBe('Investment returns');
      expect(res.body.category.color).toBe('#F59E0B');
      expect(res.body.category.icon).toBe('chart-line');

      const category = await IncomeCategory.findById(res.body.category._id);
      expect(category).toBeDefined();
      expect(category.userId.toString()).toBe(user._id.toString());
    });

    test('creates category with default values', async () => {
      const res = await request(app)
        .post('/api/income-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Test Category'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.category.color).toBe('#10B981');
      expect(res.body.category.icon).toBe('dollar-sign');
    });

    test('validates required name field', async () => {
      const res = await request(app)
        .post('/api/income-categories')
        .set('x-user-id', user._id.toString())
        .send({
          description: 'Missing name'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('validates name length', async () => {
      const res = await request(app)
        .post('/api/income-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'a'.repeat(51) // too long
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates color is hex format', async () => {
      const res = await request(app)
        .post('/api/income-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Test',
          color: 'invalid-color'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/income-categories/:id', () => {
    test('updates income category successfully', async () => {
      const category = await IncomeCategory.create({
        userId: user._id,
        name: 'Old Name',
        description: 'Old description',
        color: '#000000',
        icon: 'old-icon'
      });

      const res = await request(app)
        .put(`/api/income-categories/${category._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Updated Name',
          description: 'Updated description',
          color: '#FFFFFF',
          icon: 'new-icon'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.category.name).toBe('Updated Name');
      expect(res.body.category.description).toBe('Updated description');
      expect(res.body.category.color).toBe('#FFFFFF');
      expect(res.body.category.icon).toBe('new-icon');
    });

    test('validates update fields', async () => {
      const category = await IncomeCategory.create({
        userId: user._id,
        name: 'Test',
        icon: 'test',
        color: '#000000'
      });

      const res = await request(app)
        .put(`/api/income-categories/${category._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          name: 'a'.repeat(51) // too long
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates color format on update', async () => {
      const category = await IncomeCategory.create({
        userId: user._id,
        name: 'Test',
        icon: 'test',
        color: '#000000'
      });

      const res = await request(app)
        .put(`/api/income-categories/${category._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          color: 'not-a-hex'
        });

      expect(res.statusCode).toBe(400);
    });

    test('returns 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/income-categories/${fakeId}`)
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Updated'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/income-categories/:id', () => {
    test('soft deletes income category successfully', async () => {
      const category = await IncomeCategory.create({
        userId: user._id,
        name: 'To Delete',
        icon: 'trash',
        color: '#FF0000'
      });

      const res = await request(app)
        .delete(`/api/income-categories/${category._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');

      const deleted = await IncomeCategory.findById(category._id);
      expect(deleted.isActive).toBe(false);
    });

    test('returns 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/income-categories/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });
});
