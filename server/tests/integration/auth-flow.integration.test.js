/**
 * Integration Test: Authentication Flow
 * Tests the complete authentication workflow including registration, login, and protected routes
 */

const request = require('supertest');
const app = require('../../index');
const User = require('../../models/User');

describe('Authentication Integration Tests', () => {
  let authToken;
  const testUser = {
    name: 'Integration Test User',
    email: 'integration@test.com',
    password: 'Test123!@#'
  };

  describe('Complete Auth Flow', () => {
    it('should complete full registration -> login -> access protected route flow', async () => {
      // Step 1: Register a new user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerRes.body).toHaveProperty('token');
      expect(registerRes.body.user).toHaveProperty('email', testUser.email);
      expect(registerRes.body.user).toHaveProperty('name', testUser.name);
      expect(registerRes.body.user).not.toHaveProperty('password');

      // Step 2: Login with the registered credentials
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('token');
      authToken = loginRes.body.token;

      // Step 3: Access a protected route with the token (use dashboard endpoint)
      const dashboardRes = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify the protected route returned data
      expect(dashboardRes.body).toHaveProperty('totalBalance');
    });

    it('should prevent duplicate user registration', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Try to register with same email
      const duplicateRes = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(duplicateRes.body).toHaveProperty('message');
    });

    it('should reject invalid login credentials', async () => {
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Try to login with wrong password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(400); // API returns 400 for invalid credentials

      expect(loginRes.body).toHaveProperty('message');
    });

    it('should reject access to protected routes without token', async () => {
      await request(app)
        .get('/api/users/dashboard')
        .expect(401);
    });

    it('should reject access with invalid token', async () => {
      await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });
  });

  describe('Token Expiration and Security', () => {
    it('should maintain session across multiple requests with valid token', async () => {
      // Register and login
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      authToken = registerRes.body.token;

      // Make multiple requests with same token
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .get('/api/users/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('totalBalance');
      }
    });
  });

  describe('User Profile Management Integration', () => {
    beforeEach(async () => {
      // Register and get token for each test
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      authToken = res.body.token;
    });

    it('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name'
      };

      const updateRes = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(updateRes.body.user.name).toBe(updates.name);

      // Verify we can still access protected routes
      const dashboardRes = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(dashboardRes.body).toHaveProperty('totalBalance');
    });
  });
});
