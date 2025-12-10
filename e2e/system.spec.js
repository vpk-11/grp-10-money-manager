const { test, expect } = require('@playwright/test');

test.describe('User Authentication Flow', () => {
  test('complete user registration and login flow', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = 'SecurePass123!';
    const testName = `Test User ${timestamp}`;

    // Step 1: Navigate to register page
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h2, h1')).toContainText(/sign up|register|create account/i);

    // Step 2: Fill registration form
    await page.fill('input[name="name"], input[type="text"]', testName);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    
    // Handle confirm password if exists
    const confirmPasswordField = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm"]');
    if (await confirmPasswordField.count() > 0) {
      await confirmPasswordField.fill(testPassword);
    }

    // Step 3: Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for redirect or success message
    await page.waitForTimeout(2000);

    // Step 4: Navigate to login
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);

    // Step 5: Login with new credentials
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Step 6: Verify redirect to dashboard
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*dashboard|home/i);
  });

  test('login validation - shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"], input[type="email"]', 'invalid@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    
    // Check for error message
    const errorVisible = await page.locator('text=/invalid|incorrect|error|failed/i').count() > 0;
    expect(errorVisible).toBeTruthy();
  });
});

test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('create new account', async ({ page }) => {
    // Navigate to accounts page
    await page.goto('/accounts');
    await expect(page).toHaveURL(/.*accounts/);

    // Click add/create account button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Fill account form
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Savings Account');
    
    // Select account type
    const typeSelect = page.locator('select[name="type"], select').first();
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('savings');
    }

    // Fill balance
    await page.fill('input[name="balance"], input[type="number"]', '5000');

    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify account appears in list
    await expect(page.locator('text=Test Savings Account')).toBeVisible();
  });

  test('view account list', async ({ page }) => {
    await page.goto('/accounts');
    
    // Wait for accounts to load
    await page.waitForTimeout(1000);
    
    // Check that page has account-related elements
    const hasAccounts = await page.locator('table, .account, [data-testid*="account"]').count() > 0;
    expect(hasAccounts).toBeTruthy();
  });
});

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('add new expense', async ({ page }) => {
    // Navigate to expenses page
    await page.goto('/expenses');
    await expect(page).toHaveURL(/.*expenses/);
    await page.waitForTimeout(1000);

    // Click add expense button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Fill expense form
    await page.fill('input[name="description"], input[placeholder*="description" i]', 'Test Grocery Shopping');
    await page.fill('input[name="amount"], input[type="number"]', '150');

    // Select category if available
    const categorySelect = page.locator('select[name="categoryId"], select[name="category"]').first();
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Select account if available
    const accountSelect = page.locator('select[name="accountId"], select[name="account"]').first();
    if (await accountSelect.count() > 0) {
      await accountSelect.selectOption({ index: 1 });
    }

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify expense appears
    await expect(page.locator('text=Test Grocery Shopping')).toBeVisible();
  });

});
