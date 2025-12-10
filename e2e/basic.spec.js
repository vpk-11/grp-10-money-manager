const { test, expect } = require('@playwright/test');

test.describe('Basic System Tests', () => {
  test('application loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check that the page loaded
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log('Page title:', title);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Check for email and password inputs
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
    
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    
    console.log('Login page has email and password fields');
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register');
    await page.waitForTimeout(1000);
    
    // Check for registration form
    const nameInput = await page.locator('input[name="name"], input[type="text"]').count();
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
    
    expect(nameInput).toBeGreaterThan(0);
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    
    console.log('Register page has required fields');
  });

  test('navigation between auth pages works', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
    
    // Look for link to register
    const registerLink = page.locator('a[href*="register"], button:has-text("Sign up"), a:has-text("Sign up")').first();
    
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/.*register/);
      console.log('Navigation from login to register works');
    }
  });
});

test.describe('Protected Routes', () => {
  test('unauthenticated users are redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    
    // Should redirect to login or show login page
    const currentURL = page.url();
    const isOnLoginOrRoot = currentURL.includes('login') || currentURL === 'http://localhost:5173/';
    
    expect(isOnLoginOrRoot).toBeTruthy();
    console.log('Unauthenticated access redirected to:', currentURL);
  });

  test('unauthenticated users are redirected from accounts', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForTimeout(1500);
    
    const currentURL = page.url();
    const isOnLoginOrRoot = currentURL.includes('login') || currentURL === 'http://localhost:5173/';
    
    expect(isOnLoginOrRoot).toBeTruthy();
    console.log('Protected route redirected to:', currentURL);
  });
});

test.describe('API Health Check', () => {
  test('backend server is responding', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5000/api/accounts');
      console.log('Backend response status:', response.status());
      
      // Should get 401 (unauthorized) or 200, not 404 or 500
      expect(response.status()).not.toBe(404);
      expect(response.status()).not.toBe(500);
    } catch (error) {
      console.error('Backend not responding:', error.message);
      throw error;
    }
  });
});
