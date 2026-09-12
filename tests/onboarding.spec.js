const { test, expect } = require('@playwright/test');

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to simulate brand new user
    await page.addInitScript(() => localStorage.clear());
  });

  test('displays onboarding modal on first visit', async ({ page }) => {
    await page.goto('/');

    const setupView = page.locator('#view-setup');
    await expect(setupView).toBeVisible();
    await expect(page.locator('#view-main')).toBeHidden();
  });

  test('validates category name and daily budget', async ({ page }) => {
    await page.goto('/');

    // Try submitting empty
    await page.click('#btn-start');
    const errorMsg = page.locator('#setup-error-msg');
    await expect(errorMsg).toHaveText('Enter a category name!');

    // Enter name but 0 budget
    await page.fill('#setup-cat-name', 'Daily');
    await page.fill('#setup-input', '0');
    await page.click('#btn-start');
    await expect(errorMsg).toHaveText('Amount must be > 0!');
  });

  test('completes onboarding and initializes dashboard', async ({ page }) => {
    await page.goto('/');

    await page.fill('#setup-cat-name', 'Daily');
    await page.fill('#setup-input', '25');
    await page.click('#btn-start');

    // Main view should appear
    await expect(page.locator('#view-main')).toBeVisible();
    await expect(page.locator('#balance-display')).toHaveText('$25.00');

    // Category tab should exist
    const tabs = page.locator('#category-tabs-list .category-tab');
    await expect(tabs).toHaveCount(1);
    await expect(tabs.first()).toContainText('Daily');
  });
});
