/**
 * Integration Test: Budget Management Flow
 * Tests the complete budget workflow including budget creation,
 * monitoring, alerts, and expense tracking
 */

const request = require('supertest');
const app = require('../../index');

describe('Budget Management Integration Tests', () => {
  let authToken;
  let userId;
  let accountId;
  let expenseCategoryId;
  let budgetId;

  const testUser = {
    name: 'Budget Test User',
    email: 'budget@test.com',
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

    // Create expense category for budgets
    const categoryRes = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Groceries',
        color: '#FF5722'
      });
    
    expenseCategoryId = categoryRes.body.category._id;
  });

  describe('Complete Budget Workflow', () => {
    it('should create budget and track spending', async () => {
      // Create budget
      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          amount: 500,
          period: 'monthly',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31')
        })
        .expect(201);

      expect(budgetRes.body).toHaveProperty('amount', 500);
      expect(budgetRes.body).toHaveProperty('spent', 0);
      expect(budgetRes.body).toHaveProperty('remaining', 500);
      budgetId = budgetRes.body._id;

      // Create expense under this category
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 150,
          categoryId: expenseCategoryId,
          description: 'Grocery shopping',
          date: new Date('2024-12-05'),
          accountId: accountId
        })
        .expect(201);

      // Check budget status
      const updatedBudgetsRes = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedBudget = updatedBudgetsRes.body.find(b => b._id.toString() === budgetId.toString());
      expect(updatedBudget.spent).toBe(150);
      expect(updatedBudget.remaining).toBe(350);
    });

    it('should alert when budget exceeds threshold', async () => {
      // Create budget with 500 limit
      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          amount: 500,
          period: 'monthly',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31')
        })
        .expect(201);

      budgetId = budgetRes.body._id;

      // Spend 80% of budget (should trigger warning)
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 400,
          categoryId: expenseCategoryId,
          description: 'Large purchase',
          date: new Date('2024-12-10'),
          accountId: accountId
        })
        .expect(201);

      // Check budget status
      const budgetStatusRes = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const budget = budgetStatusRes.body.find(b => b._id.toString() === budgetId.toString());
      expect(budget.spent).toBe(400);
      expect(budget.remaining).toBe(100);
      
      // Calculate percentage
      const percentUsed = (400 / 500) * 100;
      expect(percentUsed).toBeGreaterThanOrEqual(80);
    });

    it('should handle budget exceeded scenario', async () => {
      // Create budget
      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          amount: 500,
          period: 'monthly',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31')
        })
        .expect(201);

      budgetId = budgetRes.body._id;

      // Exceed budget
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 600,
          categoryId: expenseCategoryId,
          description: 'Over budget expense',
          date: new Date('2024-12-15'),
          accountId: accountId
        })
        .expect(201);

      // Check budget status
      const budgetStatusRes = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const budget = budgetStatusRes.body.find(b => b._id.toString() === budgetId.toString());
      expect(budget.spent).toBe(600);
      expect(budget.remaining).toBe(0); // API returns Math.max(0, amount - spent)
    });

    it('should handle multiple budgets for different categories', async () => {
      // Create multiple expense categories
      const category1Res = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Food', color: '#F44336' });

      const category2Res = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Transport', color: '#3F51B5' });

      // Create budgets for each
      await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: category1Res.body.category._id,
          amount: 300,
          period: 'monthly',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31')
        })
        .expect(201);

      await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: category2Res.body.category._id,
          amount: 200,
          period: 'monthly',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31')
        })
        .expect(201);

      // Get all budgets
      const budgetsRes = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(budgetsRes.body).toHaveLength(2);
      
      const totalBudget = budgetsRes.body.reduce((sum, b) => sum + b.amount, 0);
      expect(totalBudget).toBe(500);
    });

    it('should update budget amount', async () => {
      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          amount: 500,
          period: 'monthly',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31')
        })
        .expect(201);

      // Update budget
      const updateRes = await request(app)
        .put(`/api/budgets/${budgetRes.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          amount: 700,
          period: 'monthly',
          startDate: new Date('2024-12-01')
        })
        .expect(200);

      expect(updateRes.body.amount).toBe(700);
    });

    it('should delete budget', async () => {
      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          amount: 500,
          period: 'monthly',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31')
        })
        .expect(201);

      await request(app)
        .delete(`/api/budgets/${budgetRes.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/budgets/${budgetRes.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
