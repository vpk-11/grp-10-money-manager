const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const ExpenseCategory = require('../models/ExpenseCategory');
const User = require('../models/User');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => next());

const expenseCategoriesRouter = require('../routes/expenseCategories');

function attachUser(req, res, next) {
  req.user = { _id: req.headers['x-user-id'] };
  next();
}

const app = express();
app.use(express.json());
app.use('/api/expense-categories', (req, res, next) => attachUser(req, res, next), expenseCategoriesRouter);

describe('Expense Categories API', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
  });

  describe('GET /api/expense-categories', () => {
    test('gets all active expense categories for user', async () => {
      await ExpenseCategory.create([
        {
          userId: user._id,
          name: 'Food',
          icon: 'utensils',
          color: '#22c55e',
          isActive: true
        },
        {
          userId: user._id,
          name: 'Transport',
          icon: 'car',
          color: '#3B82F6',
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
        .get('/api/expense-categories')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every(cat => cat.isActive)).toBe(true);
    });

    test('sorts categories by name', async () => {
      await ExpenseCategory.create([
        { userId: user._id, name: 'Zulu', icon: 'z', color: '#000000' },
        { userId: user._id, name: 'Alpha', icon: 'a', color: '#111111' },
        { userId: user._id, name: 'Bravo', icon: 'b', color: '#222222' }
      ]);

      const res = await request(app)
        .get('/api/expense-categories')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body[0].name).toBe('Alpha');
      expect(res.body[1].name).toBe('Bravo');
      expect(res.body[2].name).toBe('Zulu');
    });

    test('returns empty array when user has no categories', async () => {
      const res = await request(app)
        .get('/api/expense-categories')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/expense-categories/:id', () => {
    test('gets single expense category by id', async () => {
      const category = await ExpenseCategory.create({
        userId: user._id,
        name: 'Food',
        description: 'Food and groceries',
        icon: 'utensils',
        color: '#22c55e'
      });

      const res = await request(app)
        .get(`/api/expense-categories/${category._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Food');
      expect(res.body.description).toBe('Food and groceries');
    });

    test('returns 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/expense-categories/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/expense-categories', () => {
    test('creates expense category successfully', async () => {
      const res = await request(app)
        .post('/api/expense-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Entertainment',
          description: 'Movies, games, etc',
          color: '#8B5CF6',
          icon: 'gamepad'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.category.name).toBe('Entertainment');
      expect(res.body.category.description).toBe('Movies, games, etc');
      expect(res.body.category.color).toBe('#8B5CF6');
      expect(res.body.category.icon).toBe('gamepad');

      const category = await ExpenseCategory.findById(res.body.category._id);
      expect(category).toBeDefined();
      expect(category.userId.toString()).toBe(user._id.toString());
    });

    test('creates category with default values', async () => {
      const res = await request(app)
        .post('/api/expense-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Test Category'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.category.color).toBe('#3B82F6');
      expect(res.body.category.icon).toBe('shopping-cart');
      expect(res.body.category.budgetPeriod).toBe('monthly');
    });

    test('validates required name field', async () => {
      const res = await request(app)
        .post('/api/expense-categories')
        .set('x-user-id', user._id.toString())
        .send({
          description: 'Missing name'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('validates name length', async () => {
      const res = await request(app)
        .post('/api/expense-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'a'.repeat(51) // too long
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates color is hex format', async () => {
      const res = await request(app)
        .post('/api/expense-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Test',
          color: 'invalid-color'
        });

      expect(res.statusCode).toBe(400);
    });

    test('creates category with budget limit', async () => {
      const res = await request(app)
        .post('/api/expense-categories')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Food',
          budgetLimit: 500,
          budgetPeriod: 'weekly'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.category.budgetLimit).toBe(500);
      expect(res.body.category.budgetPeriod).toBe('weekly');
    });
  });

  describe('PUT /api/expense-categories/:id', () => {
    test('updates expense category successfully', async () => {
      const category = await ExpenseCategory.create({
        userId: user._id,
        name: 'Old Name',
        description: 'Old description',
        color: '#000000',
        icon: 'old-icon'
      });

      const res = await request(app)
        .put(`/api/expense-categories/${category._id}`)
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
      const category = await ExpenseCategory.create({
        userId: user._id,
        name: 'Test',
        icon: 'test',
        color: '#000000'
      });

      const res = await request(app)
        .put(`/api/expense-categories/${category._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          name: 'a'.repeat(51) // too long
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates color format on update', async () => {
      const category = await ExpenseCategory.create({
        userId: user._id,
        name: 'Test',
        icon: 'test',
        color: '#000000'
      });

      const res = await request(app)
        .put(`/api/expense-categories/${category._id}`)
        .set('x-user-id', user._id.toString())
        .send({
          color: 'not-a-hex'
        });

      expect(res.statusCode).toBe(400);
    });

    test('returns 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/expense-categories/${fakeId}`)
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Updated'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/expense-categories/:id', () => {
    test('soft deletes expense category successfully', async () => {
      const category = await ExpenseCategory.create({
        userId: user._id,
        name: 'To Delete',
        icon: 'trash',
        color: '#FF0000'
      });

      const res = await request(app)
        .delete(`/api/expense-categories/${category._id}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');

      const deleted = await ExpenseCategory.findById(category._id);
      expect(deleted.isActive).toBe(false);
    });

    test('returns 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/expense-categories/${fakeId}`)
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(404);
    });
  });
});
