/**
 * Integration Test: Account Management Flow
 * Tests the complete account workflow including account creation,
 * updates, deletion, and balance tracking
 */

const request = require('supertest');
const app = require('../../index');

describe('Account Management Integration Tests', () => {
  let authToken;
  let userId;
  let accountId1;
  let accountId2;

  const testUser = {
    name: 'Account Test User',
    email: 'account@test.com',
    password: 'Test123!@#'
  };

  beforeEach(async () => {
    // Register and login user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  describe('Complete Account Management Workflow', () => {
    it('should create and manage multiple accounts', async () => {
      // Create checking account
      const checkingRes = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Checking Account',
          type: 'checking',
          balance: 5000.00,
          currency: 'USD'
        })
        .expect(201);

      expect(checkingRes.body.account).toHaveProperty('name', 'Checking Account');
      expect(checkingRes.body.account).toHaveProperty('type', 'checking');
      expect(checkingRes.body.account).toHaveProperty('balance', 5000);
      accountId1 = checkingRes.body.account._id;

      // Create savings account
      const savingsRes = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Savings Account',
          type: 'savings',
          balance: 10000.00,
          currency: 'USD'
        })
        .expect(201);

      expect(savingsRes.body.account).toHaveProperty('name', 'Savings Account');
      accountId2 = savingsRes.body.account._id;

      // Get all accounts
      const accountsRes = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(accountsRes.body).toHaveLength(2);
      
      const totalBalance = accountsRes.body.reduce((sum, acc) => sum + acc.balance, 0);
      expect(totalBalance).toBe(15000);
    });

    it('should update account details', async () => {
      const accountRes = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Old Name',
          type: 'checking',
          balance: 1000.00,
          currency: 'USD'
        });

      const updateRes = await request(app)
        .put(`/api/accounts/${accountRes.body.account._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Account Name'
        })
        .expect(200);

      expect(updateRes.body.account.name).toBe('New Account Name');
    });

    it('should delete account', async () => {
      const accountRes = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Temporary Account',
          type: 'checking',
          balance: 100.00,
          currency: 'USD'
        });

      await request(app)
        .delete(`/api/accounts/${accountRes.body.account._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion (soft delete - isActive set to false)
      const deletedAccount = await request(app)
        .get(`/api/accounts/${accountRes.body.account._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(deletedAccount.body.isActive).toBe(false);
    });

    it('should maintain accurate balances with multiple transactions', async () => {
      // Create multiple accounts
      const checking = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Checking',
          type: 'checking',
          balance: 3000.00,
          currency: 'USD'
        })
        .expect(201);

      const savings = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Savings',
          type: 'savings',
          balance: 7000.00,
          currency: 'USD'
        })
        .expect(201);

      // Create income category and add income to checking
      const incomeCategoryRes = await request(app)
        .post('/api/income-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Salary', color: '#4CAF50' });

      await request(app)
        .post('/api/incomes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 2000,
          categoryId: incomeCategoryRes.body.category._id,
          description: 'Paycheck',
          accountId: checking.body.account._id
        })
        .expect(201);

      // Create expense category and expense from checking
      const expenseCategoryRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Bills', color: '#FF5722' });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500,
          categoryId: expenseCategoryRes.body.category._id,
          description: 'Electric bill',
          accountId: checking.body.account._id
        })
        .expect(201);

      // Verify final balances
      const checkingFinal = await request(app)
        .get(`/api/accounts/${checking.body.account._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const savingsFinal = await request(app)
        .get(`/api/accounts/${savings.body.account._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Checking: 3000 + 2000 (income) - 500 (expense) = 4500
      expect(checkingFinal.body.balance).toBe(4500);

      // Savings: 7000 (unchanged)
      expect(savingsFinal.body.balance).toBe(7000);
    });
  });

  describe('User Isolation for Accounts', () => {
    it('should not allow users to access other users accounts', async () => {
      // Create account for user 1
      const account1Res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'User 1 Account',
          type: 'checking',
          balance: 1000.00,
          currency: 'USD'
        });

      // Create user 2
      const user2 = {
        name: 'User 2',
        email: 'user2@test.com',
        password: 'Test123!@#'
      };
      
      const user2Res = await request(app)
        .post('/api/auth/register')
        .send(user2);
      
      const user2Token = user2Res.body.token;

      // User 2 tries to access user 1's account
      await request(app)
        .get(`/api/accounts/${account1Res.body.account._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      // User 2 should see no accounts
      const user2AccountsRes = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2AccountsRes.body).toHaveLength(0);
    });
  });
});
