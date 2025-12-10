const { test: setup } = require('@playwright/test');

setup('create test user', async ({ request }) => {
  // Create a test user for E2E tests
  try {
    await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }
    });
  } catch (error) {
    // User might already exist, ignore error
    console.log('Test user might already exist');
  }
});
