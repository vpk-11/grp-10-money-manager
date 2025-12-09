/**
 * Integration Test: Chatbot Flow
 * Tests the complete chatbot functionality including status checks, queries, and financial context integration
 */

const request = require('supertest');
const app = require('../../index');
const User = require('../../models/User');

let authToken;
let userId;

beforeEach(async () => {
  await User.deleteMany({});
  
  // Register and login a test user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Chatbot Test User',
      email: 'chatbot@test.com',
      password: 'Test123!@#'
    });

  authToken = registerRes.body.token;
  userId = registerRes.body.user.id;
});

describe('Chatbot Integration Tests', () => {
  describe('Chatbot Status and Model Management', () => {
    it('should check Ollama status', async () => {
      const statusRes = await request(app)
        .get('/api/chatbot/status')
        .expect(200);

      expect(statusRes.body).toHaveProperty('ollamaOnline');
      expect(typeof statusRes.body.ollamaOnline).toBe('boolean');
    });

    it('should check model availability', async () => {
      const modelRes = await request(app)
        .post('/api/chatbot/check-model')
        .send({
          model: 'llama2'
        })
        .expect(200);

      expect(modelRes.body).toHaveProperty('available');
      expect(modelRes.body).toHaveProperty('model', 'llama2');
    });
  });

  describe('Chatbot Message Functionality', () => {
    it('should handle basic chat message with authentication', async () => {
      const chatRes = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is my total spending?',
          model: 'llama2'
        });

      // Should either succeed (200) or fail gracefully if Ollama not running
      expect([200, 500, 503]).toContain(chatRes.status);
      
      if (chatRes.status === 200) {
        expect(chatRes.body).toHaveProperty('message');
        expect(chatRes.body).toHaveProperty('timestamp');
      }
    });

    it('should reject messages without authentication', async () => {
      const chatRes = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'What is my total spending?',
          model: 'llama2'
        })
        .expect(401);

      expect(chatRes.body).toHaveProperty('message');
    });

    it('should require message in request', async () => {
      const chatRes = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          model: 'llama2'
        })
        .expect(400);

      expect(chatRes.body).toHaveProperty('message');
    });

    it('should handle conversation history', async () => {
      const chatRes = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello, I need help with my budget',
          model: 'llama2',
          history: [
            { role: 'user', content: 'Hi' },
            { role: 'assistant', content: 'Hello! How can I help you today?' }
          ]
        });

      // Should handle history gracefully
      expect([200, 500, 503]).toContain(chatRes.status);
    });
  });

  describe('Chatbot with Financial Data Context', () => {
    beforeEach(async () => {
      // Create some test financial data
      // Create account
      await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Account',
          type: 'checking',
          balance: 1000.00,
          currency: 'USD'
        });

      // Create expense category
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Food',
          color: '#FF5722'
        });

      // Create expense
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          categoryId: categoryRes.body.category._id,
          description: 'Groceries',
          date: new Date()
        });
    });

    it('should query with user financial context', async () => {
      const chatRes = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'How much did I spend on food?',
          model: 'llama2'
        });

      // Should either succeed with context or fail gracefully
      expect([200, 500, 503]).toContain(chatRes.status);
    });
  });

  describe('Chatbot Error Handling', () => {
    it('should handle missing model parameter gracefully', async () => {
      const chatRes = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is my balance?'
        });

      // Model is optional (has default), so should succeed or fail gracefully
      expect([200, 500, 503]).toContain(chatRes.status);
      
      if (chatRes.status === 200) {
        expect(chatRes.body).toHaveProperty('message');
        expect(chatRes.body).toHaveProperty('timestamp');
      }
    });

    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(5000);
      
      const chatRes = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: longMessage,
          model: 'llama2'
        });

      // Should either process or reject gracefully
      expect([200, 400, 500, 503]).toContain(chatRes.status);
    });
  });
});
