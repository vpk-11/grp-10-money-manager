/**
 * Integration Test: Income Management Flow
 * Tests the complete income workflow including income category creation,
 * income tracking, and balance updates
 */

const request = require('supertest');
const app = require('../../index');

describe('Income Management Integration Tests', () => {
  let authToken;
  let userId;
  let incomeCategoryId;
  let incomeId;
  let accountId;

  const testUser = {
    name: 'Income Test User',
    email: 'income@test.com',
    password: 'Test123!@#'
  };

  beforeEach(async () => {
    // Register and login user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Create an account
    const accountRes = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Main Account',
        type: 'checking',
        balance: 1000.00,
        currency: 'USD'
      });
    
    accountId = accountRes.body.account._id;
  });

  describe('Complete Income Workflow', () => {
    it('should complete income category -> income creation -> retrieval flow', async () => {
      // Step 1: Create income category
      const categoryRes = await request(app)
        .post('/api/income-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Salary',
          color: '#4CAF50',
          icon: 'wallet'
        })
        .expect(201);

      expect(categoryRes.body.category).toHaveProperty('name', 'Salary');
      incomeCategoryId = categoryRes.body.category._id;

      // Step 2: Create an income
      const incomeRes = await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5000.00,
          categoryId: incomeCategoryId,
          description: 'Monthly salary',
          date: new Date('2024-12-01'),
          accountId: accountId
        })
        .expect(201);

      expect(incomeRes.body.income).toHaveProperty('amount', 5000);
      expect(incomeRes.body.income).toHaveProperty('description', 'Monthly salary');
      incomeId = incomeRes.body.income._id;

      // Step 3: Verify account balance increased
      const accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountRes.body.balance).toBe(6000); // 1000 + 5000

      // Step 4: Retrieve incomes
      const getIncomesRes = await request(app)
        .get('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getIncomesRes.body.incomes).toHaveLength(1);
      expect(getIncomesRes.body.incomes[0]._id).toBe(incomeId);
    });

    it('should handle multiple income sources', async () => {
      // Create multiple income categories
      const salaryCategory = await request(app)
        .post('/api/income-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Salary', color: '#4CAF50' });

      const freelanceCategory = await request(app)
        .post('/api/income-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Freelance', color: '#2196F3' });

      const investmentCategory = await request(app)
        .post('/api/income-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Investment', color: '#FF9800' });

      // Create incomes
      await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5000,
          categoryId: salaryCategory.body.category._id,
          description: 'Monthly salary',
          accountId: accountId
        })
        .expect(201);

      await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1500,
          categoryId: freelanceCategory.body.category._id,
          description: 'Website project',
          accountId: accountId
        })
        .expect(201);

      await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 300,
          categoryId: investmentCategory.body.category._id,
          description: 'Stock dividends',
          accountId: accountId
        })
        .expect(201);

      // Verify total incomes
      const incomesRes = await request(app)
        .get('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(incomesRes.body.incomes).toHaveLength(3);
      
      const totalIncome = incomesRes.body.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      expect(totalIncome).toBe(6800);

      // Verify account balance
      const accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountRes.body.balance).toBe(7800); // 1000 + 6800
    });

    it('should update income and reflect balance changes', async () => {
      const categoryRes = await request(app)
        .post('/api/income-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Bonus', color: '#E91E63' });

      const incomeRes = await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          categoryId: categoryRes.body.category._id,
          description: 'Year-end bonus',
          accountId: accountId
        })
        .expect(201);

      // Update income amount
      await request(app)
        .put(`/api/incomes/${incomeRes.body.income._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1500,
          description: 'Updated year-end bonus'
        })
        .expect(200);

      // Verify new balance (original 1000 + income adjustment of 500)
      const accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountRes.body.balance).toBe(2500); // 1000 + 1500
    });

    it('should delete income and adjust balance', async () => {
      const categoryRes = await request(app)
        .post('/api/income-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Other', color: '#9C27B0' });

      const incomeRes = await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500,
          categoryId: categoryRes.body.category._id,
          description: 'One-time income',
          accountId: accountId
        })
        .expect(201);

      // Delete income
      await request(app)
        .delete(`/api/incomes/${incomeRes.body.income._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify balance restored
      const accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountRes.body.balance).toBe(1000); // Back to original
    });
  });
});
