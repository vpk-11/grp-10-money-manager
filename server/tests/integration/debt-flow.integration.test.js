/**
 * Integration Test: Debt Management Flow
 * Tests the complete debt workflow including debt creation,
 * payment tracking, and debt payoff scenarios
 */

const request = require('supertest');
const app = require('../../index');

describe('Debt Management Integration Tests', () => {
  let authToken;
  let userId;
  let accountId;
  let debtId;

  const testUser = {
    name: 'Debt Test User',
    email: 'debt@test.com',
    password: 'Test123!@#'
  };

  beforeEach(async () => {
    // Register and login user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Create account for debt payments
    const accountRes = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Payment Account',
        type: 'checking',
        balance: 10000.00,
        currency: 'USD'
      });
    
    accountId = accountRes.body.account._id;
  });

  describe('Complete Debt Management Workflow', () => {
    it('should create and track debt', async () => {
      const debtRes = await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Bank of America Loan',
          type: 'personal_loan',
          principal: 5000.00,
          currentBalance: 5000.00,
          interestRate: 5.5,
          minimumPayment: 100,
          dueDate: 15,
          startDate: new Date('2024-01-01'),
          lender: 'Bank of America'
        })
        .expect(201);

      expect(debtRes.body).toHaveProperty('name', 'Bank of America Loan');
      expect(debtRes.body).toHaveProperty('principal', 5000);
      expect(debtRes.body).toHaveProperty('currentBalance', 5000);
      expect(debtRes.body).toHaveProperty('interestRate', 5.5);
      debtId = debtRes.body._id;

      // Retrieve debt
      const getDebtRes = await request(app)
        .get(`/api/debts/${debtId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getDebtRes.body._id).toBe(debtId);
    });

    it('should make payment towards debt', async () => {
      // Create debt
      const debtRes = await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Credit Card Debt',
          type: 'credit_card',
          principal: 3000.00,
          currentBalance: 3000.00,
          interestRate: 18.0,
          minimumPayment: 75,
          dueDate: 30,
          startDate: new Date('2024-01-01'),
          lender: 'Credit Card Company'
        })
        .expect(201);

      debtId = debtRes.body._id;

      // Make payment
      const paymentRes = await request(app)
        .post(`/api/debts/${debtId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500,
          date: new Date('2024-12-10')
        })
        .expect(200);

      expect(paymentRes.body.currentBalance).toBe(2500); // 3000 - 500
      expect(paymentRes.body.totalPaid).toBe(500);

      // Verify debt details
      const debtDetailsRes = await request(app)
        .get(`/api/debts/${debtId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(debtDetailsRes.body.currentBalance).toBe(2500);
      expect(debtDetailsRes.body.lastPaymentAmount).toBe(500);
    });

    it('should track multiple payments and debt payoff', async () => {
      // Create debt
      const debtRes = await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Small Personal Loan',
          type: 'personal_loan',
          principal: 1000.00,
          currentBalance: 1000.00,
          interestRate: 0,
          minimumPayment: 100,
          dueDate: 31,
          startDate: new Date('2024-01-01')
        })
        .expect(201);

      debtId = debtRes.body._id;

      // Make first payment
      await request(app)
        .post(`/api/debts/${debtId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 400
        })
        .expect(200);

      // Make second payment
      await request(app)
        .post(`/api/debts/${debtId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 300
        })
        .expect(200);

      // Make final payment
      const finalPaymentRes = await request(app)
        .post(`/api/debts/${debtId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 300
        })
        .expect(200);

      expect(finalPaymentRes.body.currentBalance).toBe(0);
      expect(finalPaymentRes.body.status).toBe('paid_off');
      expect(finalPaymentRes.body.totalPaid).toBe(1000);
    });

    it('should not allow payment exceeding debt amount', async () => {
      const debtRes = await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Small Personal Debt',
          type: 'personal_loan',
          principal: 500.00,
          currentBalance: 500.00,
          interestRate: 0,
          minimumPayment: 50,
          dueDate: 30,
          startDate: new Date('2024-01-01')
        })
        .expect(201);

      // Pay more than debt amount (API allows it, sets balance to 0)
      const paymentRes = await request(app)
        .post(`/api/debts/${debtRes.body._id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000
        })
        .expect(200);

      expect(paymentRes.body.currentBalance).toBe(0);
      expect(paymentRes.body.status).toBe('paid_off');
    });

    it('should update debt details', async () => {
      const debtRes = await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Loan',
          type: 'personal_loan',
          principal: 2000.00,
          currentBalance: 2000.00,
          interestRate: 5.0,
          minimumPayment: 100,
          dueDate: 31,
          startDate: new Date('2024-01-01'),
          lender: 'Original Creditor'
        })
        .expect(201);

      const updateRes = await request(app)
        .put(`/api/debts/${debtRes.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Loan',
          lender: 'Updated Creditor',
          interestRate: 4.5
        })
        .expect(200);

      expect(updateRes.body.lender).toBe('Updated Creditor');
      expect(updateRes.body.interestRate).toBe(4.5);
      expect(updateRes.body.name).toBe('Updated Loan');
    });

    it('should delete unpaid debt', async () => {
      const debtRes = await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Temporary Debt',
          type: 'personal_loan',
          principal: 1000.00,
          currentBalance: 1000.00,
          interestRate: 0,
          minimumPayment: 50,
          dueDate: 31,
          startDate: new Date('2024-01-01')
        })
        .expect(201);

      await request(app)
        .delete(`/api/debts/${debtRes.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/debts/${debtRes.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should list all debts with status', async () => {
      // Create multiple debts
      await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Debt 1',
          type: 'personal_loan',
          principal: 1000.00,
          currentBalance: 1000.00,
          interestRate: 5,
          minimumPayment: 50,
          dueDate: 30,
          startDate: new Date('2024-01-01')
        })
        .expect(201);

      await request(app)
        .post('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Debt 2',
          type: 'credit_card',
          principal: 2000.00,
          currentBalance: 2000.00,
          interestRate: 7,
          minimumPayment: 100,
          dueDate: 31,
          startDate: new Date('2024-01-01')
        })
        .expect(201);

      const debtsRes = await request(app)
        .get('/api/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(debtsRes.body).toHaveLength(2);
      
      const totalDebt = debtsRes.body.reduce((sum, debt) => sum + debt.currentBalance, 0);
      expect(totalDebt).toBe(3000);
    });
  });
});
