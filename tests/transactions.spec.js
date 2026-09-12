const { test, expect } = require('@playwright/test');
const { createTestState, seedStorage } = require('./helpers');

test.describe('Budget Transactions & History Drawer', () => {
  test.beforeEach(async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_daily', name: 'Daily', budget: 25, balance: 25, transactions: [] },
        { id: 'cat_food', name: 'Food', budget: 40, balance: 40, transactions: [] }
      ],
      activeCategoryId: 'cat_daily'
    });
    await seedStorage(page, state);
    await page.goto('/');
  });

  test('validates transaction amount', async ({ page }) => {
    // Try to spend with empty / zero input
    await page.fill('#tx-amount', '0');
    await page.click('#btn-spend');

    const errorBubble = page.locator('#tx-error');
    await expect(errorBubble).not.toHaveClass(/opacity-0/);
    await expect(page.locator('#balance-display')).toHaveText('$25.00');
  });

  test('records a spend transaction and deducts balance', async ({ page }) => {
    await page.fill('#tx-amount', '10.50');
    await page.fill('#tx-desc', 'Lunch');
    await page.click('#btn-spend');

    // Balance should decrease from $25.00 to $14.50
    await expect(page.locator('#balance-display')).toHaveText('$14.50');

    // Open history drawer
    await page.click('#drawer-header');

    // Verify transaction appears in history drawer
    const historyItem = page.locator('#history-list > div').first();
    await expect(historyItem).toContainText('-$10.50');
    await expect(historyItem).toContainText('Lunch');
  });

  test('records an income transaction and adds to balance', async ({ page }) => {
    await page.fill('#tx-amount', '20.00');
    await page.fill('#tx-desc', 'Side gig');
    await page.click('#btn-get');

    // Balance should increase from $25.00 to $45.00
    await expect(page.locator('#balance-display')).toHaveText('$45.00');

    // Check history
    await page.click('#drawer-header');
    const historyItem = page.locator('#history-list > div').first();
    await expect(historyItem).toContainText('+$20.00');
    await expect(historyItem).toContainText('Side gig');
  });

  test('deleting a transaction restores balance', async ({ page }) => {
    // Add a spend
    await page.fill('#tx-amount', '5.00');
    await page.fill('#tx-desc', 'Coffee');
    await page.click('#btn-spend');
    await expect(page.locator('#balance-display')).toHaveText('$20.00');

    // Open drawer and delete the transaction
    await page.click('#drawer-header');
    const deleteBtn = page.locator('#history-list .delete-btn').first();
    await deleteBtn.click();

    // Balance should restore back to $25.00
    await expect(page.locator('#balance-display')).toHaveText('$25.00');
    await expect(page.locator('#history-list')).toContainText('No transactions yet!');
  });

  test('reset button clears history and resets balance to daily budget', async ({ page }) => {
    // Spend some money
    await page.fill('#tx-amount', '15.00');
    await page.click('#btn-spend');
    await expect(page.locator('#balance-display')).toHaveText('$10.00');

    // Click Reset in header
    await page.click('#btn-reset');
    const confirmModal = page.locator('#modal-confirm');
    await expect(confirmModal).not.toHaveClass(/opacity-0/);

    // Confirm reset
    await page.click('#btn-confirm-yes');
    await expect(confirmModal).toHaveClass(/opacity-0/);

    // Balance should be reset to daily budget ($25.00)
    await expect(page.locator('#balance-display')).toHaveText('$25.00');

    // History should be empty
    await page.click('#drawer-header');
    await expect(page.locator('#history-list')).toContainText('No transactions yet!');
  });
});
