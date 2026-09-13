const { test, expect } = require('@playwright/test');
const { createTestState, seedStorage } = require('./helpers');

test.describe('Header Hamburger Menu & Action Consolidation', () => {
  test.beforeEach(async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 30, balance: 25 },
        { id: 'cat_fun', name: 'Fun', budget: 20, balance: -10 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');
  });

  test('header displays overview button and hamburger menu button outside', async ({ page }) => {
    const btnOverview = page.locator('#btn-overview');
    const btnMenu = page.locator('#btn-menu');
    const dropdown = page.locator('#menu-dropdown');

    // Both buttons should be visible on header
    await expect(btnOverview).toBeVisible();
    await expect(btnMenu).toBeVisible();

    // Reset and settings are inside dropdown and hidden by default
    await expect(dropdown).toHaveClass(/hidden/);
    await expect(page.locator('#menu-dropdown #btn-settings')).toBeHidden();
    await expect(page.locator('#menu-dropdown #btn-reset')).toBeHidden();
  });

  test('overview button operates directly from header without opening menu', async ({ page }) => {
    const modalOverview = page.locator('#modal-overview');
    const dropdown = page.locator('#menu-dropdown');

    await page.click('#btn-overview');
    await expect(modalOverview).not.toHaveClass(/opacity-0/);
    await expect(dropdown).toHaveClass(/hidden/);

    await page.click('#btn-done-overview');
    await expect(modalOverview).toHaveClass(/opacity-0/);
  });

  test('clicking hamburger button toggles dropdown menu open and closed', async ({ page }) => {
    const btnMenu = page.locator('#btn-menu');
    const dropdown = page.locator('#menu-dropdown');

    await expect(btnMenu).toHaveAttribute('aria-expanded', 'false');
    await expect(dropdown).toHaveClass(/hidden/);

    // Click to open
    await btnMenu.click();
    await expect(dropdown).not.toHaveClass(/hidden/);
    await expect(btnMenu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#menu-dropdown #btn-settings')).toBeVisible();
    await expect(page.locator('#menu-dropdown #btn-reset')).toBeVisible();

    // Click again to close
    await btnMenu.click();
    await expect(dropdown).toHaveClass(/hidden/);
    await expect(btnMenu).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking outside dropdown menu closes it', async ({ page }) => {
    const dropdown = page.locator('#menu-dropdown');
    await page.click('#btn-menu');
    await expect(dropdown).not.toHaveClass(/hidden/);

    // Click outside on the balance display
    await page.click('#balance-display');
    await expect(dropdown).toHaveClass(/hidden/);
  });

  test('pressing Escape key closes dropdown menu', async ({ page }) => {
    const dropdown = page.locator('#menu-dropdown');
    await page.click('#btn-menu');
    await expect(dropdown).not.toHaveClass(/hidden/);

    await page.keyboard.press('Escape');
    await expect(dropdown).toHaveClass(/hidden/);
  });

  test('selecting Settings opens settings modal and closes dropdown', async ({ page }) => {
    const dropdown = page.locator('#menu-dropdown');
    const modalSettings = page.locator('#modal-settings');

    await page.click('#btn-menu');
    await page.click('#btn-settings');

    // Settings modal is visible, dropdown is closed
    await expect(modalSettings).not.toHaveClass(/opacity-0/);
    await expect(dropdown).toHaveClass(/hidden/);

    // Close settings
    await page.click('#btn-close-settings');
    await expect(modalSettings).toHaveClass(/opacity-0/);
  });

  test('selecting Reset opens confirmation modal and closes dropdown', async ({ page }) => {
    const dropdown = page.locator('#menu-dropdown');
    const modalConfirm = page.locator('#modal-confirm');

    await page.click('#btn-menu');
    await page.click('#btn-reset');

    // Confirm modal is visible, dropdown is closed
    await expect(modalConfirm).not.toHaveClass(/opacity-0/);
    await expect(dropdown).toHaveClass(/hidden/);

    // Cancel reset
    await page.click('#btn-confirm-cancel');
    await expect(modalConfirm).toHaveClass(/opacity-0/);
  });

  test('reset flow displays pre-reset overview snapshot and resets active balance', async ({ page }) => {
    // Current pre-reset state: Food balance $25, Fun balance -$10 -> Net = +$15.00
    await page.click('#btn-menu');
    await page.click('#btn-reset');
    await page.click('#btn-confirm-yes');

    // Pre-reset overview modal appears
    const modalOverview = page.locator('#modal-overview');
    await expect(modalOverview).not.toHaveClass(/opacity-0/);
    await expect(page.locator('#overview-subtitle')).toHaveText('Summary before reset');
    await expect(page.locator('#overview-total-balance')).toHaveText('+$15.00');

    // Dismiss overview
    await page.click('#btn-done-overview');
    await expect(modalOverview).toHaveClass(/opacity-0/);

    // Balance on dashboard is reset to daily budget ($30.00)
    await expect(page.locator('#balance-display')).toHaveText('$30.00');

    // Subsequent click on header Overview shows post-reset data (30 + 20 = $50.00)
    await page.click('#btn-overview');
    await expect(modalOverview).not.toHaveClass(/opacity-0/);
    await expect(page.locator('#overview-subtitle')).toBeHidden();
    await expect(page.locator('#overview-total-balance')).toHaveText('+$50.00');
  });
});
