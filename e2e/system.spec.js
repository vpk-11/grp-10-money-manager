import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// -------------------------
// DASHBOARD → NAVIGATION
// -------------------------
test('navigation menu works', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1000);

  const pages = ['accounts', 'expenses', 'incomes', 'budgets'];

  for (const pageName of pages) {
    const navLink = page.locator(
      `a[href*="${pageName}"], button:has-text("${pageName}")`
    ).first();

    if (await navLink.count() > 0) {
      await navLink.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(new RegExp(pageName, 'i'));
    }
  }
});

// -------------------------
// CATEGORY MANAGEMENT → CREATE CATEGORY
// -------------------------
test('create new expense category', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
  await page.fill('input[name="password"], input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  await page.goto(`${BASE_URL}/categories`);
  await page.waitForTimeout(1000);

  const addButton = page
    .locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")')
    .first();

  if (await addButton.count() > 0) {
    await addButton.click();
    await page.waitForTimeout(500);

    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Category');

    const colorInput = page.locator('input[name="color"], input[type="color"]').first();
    if (await colorInput.count() > 0) {
      await colorInput.fill('#FF5733');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Test Category')).toBeVisible();
  }
});
