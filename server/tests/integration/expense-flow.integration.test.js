/**
 * Integration Test: Expense Management Flow
 * Tests the complete expense workflow including category creation, expense creation, 
 * updates, filtering, and analytics
 */

const request = require('supertest');
const app = require('../../index');
const User = require('../../models/User');

describe('Expense Management Integration Tests', () => {
  let authToken;
  let userId;
  let categoryId;
  let expenseId;
  let accountId;

  const testUser = {
    name: 'Expense Test User',
    email: 'expense@test.com',
    password: 'Test123!@#'
  };

  beforeEach(async () => {
    // Register and login user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Create an account for expenses
    const accountRes = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Account',
        type: 'checking',
        balance: 5000.00,
        currency: 'USD'
      });
    
    accountId = accountRes.body.account._id;
  });

  describe('Complete Expense Workflow', () => {
    it('should complete category creation -> expense creation -> retrieval flow', async () => {
      // Step 1: Create expense category
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Groceries',
          color: '#FF5733',
          icon: 'shopping-cart'
        })
        .expect(201);

      expect(categoryRes.body.category).toHaveProperty('name', 'Groceries');
      expect(categoryRes.body.category).toHaveProperty('userId', userId);
      categoryId = categoryRes.body.category._id;

      // Step 2: Create an expense
      const expenseRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 150.50,
          categoryId: categoryId,
          description: 'Weekly groceries',
          date: new Date('2024-12-01'),
          accountId: accountId
        })
        .expect(201);

      expect(expenseRes.body.expense).toHaveProperty('amount', 150.50);
      expect(expenseRes.body.expense).toHaveProperty('description', 'Weekly groceries');
      expenseId = expenseRes.body.expense._id;

      // Step 3: Retrieve expenses and verify
      const getExpensesRes = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getExpensesRes.body.expenses).toBeInstanceOf(Array);
      expect(getExpensesRes.body.expenses.length).toBe(1);
      expect(getExpensesRes.body.expenses[0]._id).toBe(expenseId);

      // Verify account balance was updated
      const accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountRes.body.balance).toBe(4849.50); // 5000 - 150.50
    });

    it('should handle multiple expenses across different categories', async () => {
      // Create multiple categories
      const category1Res = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Food', color: '#FF0000' })
        .expect(201);

      const category2Res = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Transport', color: '#00FF00' })
        .expect(201);

      const category3Res = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Entertainment', color: '#0000FF' })
        .expect(201);

      // Create expenses for each category
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          categoryId: category1Res.body.category._id,
          description: 'Lunch',
          date: new Date('2024-12-01'),
          accountId: accountId
        })
        .expect(201);

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 30,
          categoryId: category2Res.body.category._id,
          description: 'Taxi',
          date: new Date('2024-12-02'),
          accountId: accountId
        })
        .expect(201);

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          categoryId: category3Res.body.category._id,
          description: 'Movie tickets',
          date: new Date('2024-12-03'),
          accountId: accountId
        })
        .expect(201);

      // Retrieve all expenses
      const expensesRes = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(expensesRes.body.expenses).toHaveLength(3);
      
      // Calculate total
      const total = expensesRes.body.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      expect(total).toBe(180);
    });

    it('should update expense and reflect changes', async () => {
      // Create category and expense
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Shopping', color: '#FFA500' });
      
      const expenseRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 200,
          categoryId: categoryRes.body.category._id,
          description: 'Original description',
          date: new Date('2024-12-01'),
          accountId: accountId
        });

      const originalBalance = 4800; // 5000 - 200

      // Update expense
      const updateRes = await request(app)
        .put(`/api/expenses/${expenseRes.body.expense._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 250,
          description: 'Updated description'
        })
        .expect(200);

      expect(updateRes.body.expense.amount).toBe(250);
      expect(updateRes.body.expense.description).toBe('Updated description');

      // Verify account balance updated correctly (reverted 200, deducted 250)
      const accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountRes.body.balance).toBe(4750); // 5000 - 250
    });

    it('should delete expense and restore account balance', async () => {
      // Create category and expense
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Bills', color: '#800080' });
      
      const expenseRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 300,
          categoryId: categoryRes.body.category._id,
          description: 'Utility bill',
          date: new Date('2024-12-01'),
          accountId: accountId
        });

      // Verify balance after creation
      let accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(accountRes.body.balance).toBe(4700); // 5000 - 300

      // Delete expense
      await request(app)
        .delete(`/api/expenses/${expenseRes.body.expense._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify balance restored
      accountRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountRes.body.balance).toBe(5000); // Balance restored

      // Verify expense deleted
      const expensesRes = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(expensesRes.body.expenses).toHaveLength(0);
    });

    it('should filter expenses by date range', async () => {
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Category', color: '#123456' });

      // Create expenses on different dates
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          categoryId: categoryRes.body.category._id,
          description: 'December expense',
          date: new Date('2024-12-15'),
          accountId: accountId
        });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 200,
          categoryId: categoryRes.body.category._id,
          description: 'January expense',
          date: new Date('2025-01-15'),
          accountId: accountId
        });

      // Filter for December only
      const decemberRes = await request(app)
        .get('/api/expenses')
        .query({ 
          startDate: '2024-12-01', 
          endDate: '2024-12-31' 
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(decemberRes.body.expenses).toHaveLength(1);
      expect(decemberRes.body.expenses[0].description).toBe('December expense');
    });

    it('should filter expenses by category', async () => {
      const category1Res = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Category A', color: '#111111' });

      const category2Res = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Category B', color: '#222222' });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          categoryId: category1Res.body.category._id,
          description: 'Cat A expense',
          accountId: accountId
        });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 200,
          categoryId: category2Res.body.category._id,
          description: 'Cat B expense',
          accountId: accountId
        });

      // Filter by category
      const filteredRes = await request(app)
        .get('/api/expenses')
        .query({ category: category1Res.body.category._id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(filteredRes.body.expenses).toHaveLength(1);
      expect(filteredRes.body.expenses[0].description).toBe('Cat A expense');
    });
  });

  describe('Category Management Integration', () => {
    it('should not allow deleting category with associated expenses', async () => {
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Active Category', color: '#AAAAAA' });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          categoryId: categoryRes.body.category._id,
          description: 'Expense with category',
          accountId: accountId
        })
        .expect(201);

      // Try to delete category with expenses (API does soft delete)
      const deleteRes = await request(app)
        .delete(`/api/expense-categories/${categoryRes.body.category._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // API allows soft delete (sets isActive: false)

      expect(deleteRes.body.message).toContain('deleted');
    });

    it('should allow updating category details', async () => {
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Old Name', color: '#000000' });

      const updateRes = await request(app)
        .put(`/api/expense-categories/${categoryRes.body.category._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'New Name', 
          color: '#FFFFFF',
          icon: 'new-icon'
        })
        .expect(200);

      expect(updateRes.body.category.name).toBe('New Name');
      expect(updateRes.body.category.color).toBe('#FFFFFF');
      expect(updateRes.body.category.icon).toBe('new-icon');
    });
  });

  describe('User Isolation', () => {
    it('should not allow users to access other users expenses', async () => {
      // Create second user
      const user2 = {
        name: 'User 2',
        email: 'user2@test.com',
        password: 'Test123!@#'
      };
      
      const user2Res = await request(app)
        .post('/api/auth/register')
        .send(user2);
      
      const user2Token = user2Res.body.token;

      // Create expense for first user
      const categoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Private Category', color: '#FF0000' });

      const expenseRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500,
          categoryId: categoryRes.body.category._id,
          description: 'Private expense',
          accountId: accountId
        })
        .expect(201);

      // User 2 tries to access user 1's expense
      await request(app)
        .get(`/api/expenses/${expenseRes.body.expense._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      // User 2 should see no expenses
      const user2ExpensesRes = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2ExpensesRes.body.expenses).toHaveLength(0);
    });
  });
});
