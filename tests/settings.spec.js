const { test, expect } = require('@playwright/test');
const { createTestState, seedStorage } = require('./helpers');

test.describe('Consolidated Settings & Preferences', () => {
  test.beforeEach(async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_daily', name: 'Daily', budget: 25, balance: 25 },
        { id: 'cat_food', name: 'Food', budget: 40, balance: 40 },
        { id: 'cat_transport', name: 'Transport', budget: 15, balance: 15 }
      ],
      activeCategoryId: 'cat_daily',
      defaultCategoryId: null
    });
    await seedStorage(page, state);
    await page.goto('/');
  });

  test('opens settings modal with all categories and default category dropdown', async ({ page }) => {
    await page.click('#btn-settings');
    const modal = page.locator('#modal-settings');
    await expect(modal).not.toHaveClass(/opacity-0/);

    // Verify Default Category selector options
    const defaultSelect = page.locator('#settings-default-category');
    await expect(defaultSelect).toBeVisible();
    await expect(defaultSelect.locator('option')).toHaveCount(4); // Last Used + 3 categories

    // Verify all 3 category rows are displayed simultaneously with side-by-side inputs
    const rows = page.locator('#settings-categories-list .category-row');
    await expect(rows).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const row = rows.nth(i);
      await expect(row.locator('.drag-handle')).toBeVisible();
      await expect(row.locator('.cat-name-input')).toBeVisible();
      await expect(row.locator('.cat-budget-input')).toBeVisible();
      await expect(row.locator('.btn-delete-row')).toBeVisible();
    }
  });

  test('syncs edited category name to default category dropdown in real time', async ({ page }) => {
    await page.click('#btn-settings');

    const firstRowNameInput = page.locator('#settings-categories-list .category-row:first-child .cat-name-input');
    await firstRowNameInput.fill('Everyday');

    const option = page.locator('#settings-default-category option[value="cat_daily"]');
    await expect(option).toHaveText('Everyday');
  });

  test('validates settings inputs on save', async ({ page }) => {
    await page.click('#btn-settings');
    const errorMsg = page.locator('#settings-error-msg');

    // Test empty name
    const firstRowName = page.locator('#settings-categories-list .category-row:first-child .cat-name-input');
    await firstRowName.fill('');
    await page.click('#btn-save-settings');
    await expect(errorMsg).toHaveText('Enter a category name!');

    // Test zero budget
    await firstRowName.fill('Daily');
    const firstRowBudget = page.locator('#settings-categories-list .category-row:first-child .cat-budget-input');
    await firstRowBudget.fill('0');
    await page.click('#btn-save-settings');
    await expect(errorMsg).toHaveText('Amount must be > 0!');

    // Test duplicate names
    await firstRowBudget.fill('25');
    await firstRowName.fill('Food'); // Food already exists in row 2
    await page.click('#btn-save-settings');
    await expect(errorMsg).toHaveText('Category names must be unique!');
  });

  test('saves changes and updates main dashboard', async ({ page }) => {
    await page.click('#btn-settings');

    // Edit food budget from 40 to 60
    const foodBudgetInput = page.locator('#settings-categories-list .category-row').nth(1).locator('.cat-budget-input');
    await foodBudgetInput.fill('60');

    await page.click('#btn-save-settings');
    await expect(page.locator('#modal-settings')).toHaveClass(/opacity-0/);

    // Switch to Food tab and verify daily budget amount updated
    await page.locator('#category-tabs-list .category-tab', { hasText: 'Food' }).click();
    await expect(page.locator('#daily-amount-display')).toContainText('60');
  });

  test('persists default category on launch', async ({ page }) => {
    await page.click('#btn-settings');

    // Select 'Transport' as default category on launch
    await page.selectOption('#settings-default-category', 'cat_transport');
    await page.click('#btn-save-settings');

    // Now reload page to simulate opening the app anew
    await page.reload();

    // Active tab should automatically be Transport
    await expect(page.locator('#category-tabs-list .category-tab.active')).toContainText('Transport');
    await expect(page.locator('#balance-display')).toHaveText('$15.00');
  });
});
