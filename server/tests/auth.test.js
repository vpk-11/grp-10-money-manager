const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mock the auth middleware for protected routes
jest.mock('../middleware/auth', () => (req, res, next) => {
  const UserModel = require('../models/User');
  req.user = { _id: req.headers['x-user-id'] };
  UserModel.findById(req.user._id).then(user => {
    req.user = user;
    next();
  });
});

const authRouter = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Set JWT secret for testing
process.env.JWT_SECRET = 'test-secret-key';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    test('registers new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('John Doe');
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.body.user.password).toBeUndefined();

      // Verify user exists in database
      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
    });

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John'
          // missing email and password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('validates name length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'J', // too short
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates password length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '12345' // too short
        });

      expect(res.statusCode).toBe(400);
    });

    test('prevents duplicate email registration', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    test('hashes password before saving', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      const user = await User.findOne({ email: 'john@example.com' });
      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      await user.save();
    });

    test('logs in user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.password).toBeUndefined();
    });

    test('updates lastLogin timestamp on login', async () => {
      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.lastLogin).toBeDefined();
      expect(new Date(user.lastLogin).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });

    test('rejects login with incorrect email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid credentials');
    });

    test('rejects login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid credentials');
    });

    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        });

      expect(res.statusCode).toBe(400);
    });

    test('returns valid JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.body.token).toBeDefined();
      
      // Verify token is valid
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        currency: 'USD',
        timezone: 'America/New_York'
      });
      await user.save();
    });

    test('returns current user data', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-user-id', user._id.toString());

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.currency).toBe('USD');
      expect(res.body.user.password).toBeUndefined();
    });
  });

  describe('PUT /api/auth/profile', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      await user.save();
    });

    test('updates user profile successfully', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'Updated Name',
          currency: 'EUR',
          timezone: 'Europe/London'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
      expect(res.body.user.currency).toBe('EUR');
      expect(res.body.user.timezone).toBe('Europe/London');

      const updated = await User.findById(user._id);
      expect(updated.name).toBe('Updated Name');
    });

    test('validates name length', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('x-user-id', user._id.toString())
        .send({
          name: 'J' // too short
        });

      expect(res.statusCode).toBe(400);
    });

    test('validates currency enum', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('x-user-id', user._id.toString())
        .send({
          currency: 'INVALID'
        });

      expect(res.statusCode).toBe(400);
    });

    test('allows partial updates', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('x-user-id', user._id.toString())
        .send({
          currency: 'GBP'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.currency).toBe('GBP');
      expect(res.body.user.name).toBe('Test User'); // unchanged
    });
  });
});
