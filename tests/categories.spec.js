const { test, expect } = require('@playwright/test');
const { createTestState, seedStorage } = require('./helpers');

test.describe('Categories & Tabs Management', () => {
  test.beforeEach(async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_daily', name: 'Daily', budget: 25, balance: 25 },
        { id: 'cat_food', name: 'Food', budget: 40, balance: 35 },
        { id: 'cat_transport', name: 'Transport', budget: 15, balance: 10 }
      ],
      activeCategoryId: 'cat_daily'
    });
    await seedStorage(page, state);
    await page.goto('/');
  });

  test('renders all category tabs on main dashboard', async ({ page }) => {
    const tabs = page.locator('#category-tabs-list .category-tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('Daily');
    await expect(tabs.nth(1)).toContainText('Food');
    await expect(tabs.nth(2)).toContainText('Transport');
  });

  test('switching tabs updates active balance and display', async ({ page }) => {
    await expect(page.locator('#balance-display')).toHaveText('$25.00');

    // Click 'Food' tab
    await page.locator('#category-tabs-list .category-tab', { hasText: 'Food' }).click();
    await expect(page.locator('#balance-display')).toHaveText('$35.00');

    // Click 'Transport' tab
    await page.locator('#category-tabs-list .category-tab', { hasText: 'Transport' }).click();
    await expect(page.locator('#balance-display')).toHaveText('$10.00');
  });

  test('adds a new category successfully', async ({ page }) => {
    await page.click('#btn-add-category');
    await expect(page.locator('#modal-new-category')).toBeVisible();

    await page.fill('#new-cat-name', 'Fitness');
    await page.fill('#new-cat-budget', '50');
    await page.click('#btn-create-category');

    // Tab should now be added and active
    const tabs = page.locator('#category-tabs-list .category-tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(3)).toContainText('Fitness');
    await expect(page.locator('#balance-display')).toHaveText('$50.00');
    // Category tabs should not have close/delete buttons
    await expect(page.locator('#category-tabs-list .category-tab button')).toHaveCount(0);
  });

  test('validates duplicate category name', async ({ page }) => {
    await page.click('#btn-add-category');
    await page.fill('#new-cat-name', 'Daily'); // Already exists
    await page.fill('#new-cat-budget', '10');
    await page.click('#btn-create-category');

    const errorMsg = page.locator('#new-cat-error-msg');
    await expect(errorMsg).toHaveText('Category already exists!');
  });

  test('deletes a category with confirmation via settings', async ({ page }) => {
    // Tabs do not have delete buttons
    await expect(page.locator('#category-tabs-list .category-tab button')).toHaveCount(0);

    // Open Settings and delete 'Transport'
    await page.click('#btn-menu');
    await page.click('#btn-settings');

    const transportRow = page.locator('#settings-categories-list .category-row[data-id="cat_transport"]');
    await transportRow.locator('.btn-delete-row').click();

    // Confirm modal should appear
    const confirmModal = page.locator('#modal-confirm');
    await expect(confirmModal).toBeVisible();

    await page.click('#btn-confirm-yes');
    await expect(confirmModal).toHaveClass(/opacity-0/);

    // Transport should be deleted
    const tabs = page.locator('#category-tabs-list .category-tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toContainText('Daily');
    await expect(tabs.nth(1)).toContainText('Food');
  });
});
