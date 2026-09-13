const { test, expect } = require('@playwright/test');
const { createTestState, seedStorage } = require('./helpers');

test.describe('Budget Overview & Surplus/Deficit Feature', () => {

  test('opens and closes overview modal via header button, done button, close button, and escape key', async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 20, balance: 20 },
        { id: 'cat_travel', name: 'Travel', budget: 15, balance: -10 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');

    const modal = page.locator('#modal-overview');
    await expect(modal).toHaveClass(/opacity-0/);

    // 1. Open via header button
    await page.click('#btn-overview');
    await expect(modal).not.toHaveClass(/opacity-0/);

    // 2. Close via Done button
    await page.click('#btn-done-overview');
    await expect(modal).toHaveClass(/opacity-0/);

    // 3. Open via header button and close via Escape key
    await page.click('#btn-overview');
    await expect(modal).not.toHaveClass(/opacity-0/);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveClass(/opacity-0/);

    // 4. Open via header button and close via X button
    await page.click('#btn-overview');
    await expect(modal).not.toHaveClass(/opacity-0/);
    await page.click('#btn-close-overview');
    await expect(modal).toHaveClass(/opacity-0/);
  });

  test('computes net surplus accurately when categories are net positive (user scenario)', async ({ page }) => {
    // Food has budget $20 and balance $20, Travel has balance -$10 (overspent by $10) -> Net +$10.00
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 20, balance: 20 },
        { id: 'cat_travel', name: 'Travel', budget: 15, balance: -10 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');

    // Verify there is NO net status pill beneath active balance
    await expect(page.locator('#btn-overview-pill')).toHaveCount(0);

    // Open overview modal
    await page.click('#btn-overview');

    // Verify modal header and hero copy
    const modal = page.locator('#modal-overview');
    await expect(modal).not.toContainText('Total net balance & category breakdown');
    await expect(modal).not.toContainText('Tap category to jump');
    await expect(page.locator('#overview-hero-card')).toContainText('Net Balance Across All Categories');

    // Verify hero card values & surplus coloring
    const totalBalance = page.locator('#overview-total-balance');
    await expect(totalBalance).toHaveText('+$10.00');
    await expect(totalBalance).toHaveClass(/text-emerald-600/);
    await expect(page.locator('#overview-hero-card')).toHaveClass(/bg-emerald-100/);

    // Verify there is NO "deficit: down x" or surplus pill under hero balance
    await expect(page.locator('#overview-status-badge')).toHaveCount(0);

    // Verify Average Used Per Day & Daily Allowance (categories status box removed)
    await expect(page.locator('#overview-status-counts')).toHaveCount(0);
    await expect(page.locator('#overview-hero-card')).toContainText('Average Used Per Day');
    await expect(page.locator('#overview-avg-used')).toHaveText('$0.00');
    await expect(page.locator('#overview-daily-total')).toHaveText('$35.00');

    // Verify categories list header and cards (compact, inline, no Active badge)
    await expect(modal).toContainText('Categories');
    await expect(modal).not.toContainText('Categories Breakdown');
    const cards = page.locator('#overview-categories-list .category-overview-card');
    await expect(cards).toHaveCount(2);

    const foodCard = cards.nth(0);
    await expect(foodCard).toContainText('Food');
    await expect(foodCard).toContainText('+$20/day');
    await expect(foodCard).not.toContainText('Active');
    const foodBalance = foodCard.locator('span.font-black', { hasText: '$20.00' });
    await expect(foodBalance).toBeVisible();
    await expect(foodBalance).toHaveClass(/text-emerald-600/);

    const travelCard = cards.nth(1);
    await expect(travelCard).toContainText('Travel');
    await expect(travelCard).toContainText('+$15/day');
    const travelBalance = travelCard.locator('span.font-black', { hasText: '-$10.00' });
    await expect(travelBalance).toBeVisible();
    await expect(travelBalance).toHaveClass(/text-orange-500/);

    // Verify NO over/under badge text beneath category balance
    await expect(foodCard).not.toContainText('Under');
    await expect(travelCard).not.toContainText('Over');
  });

  test('computes net deficit accurately when categories are net negative', async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 20, balance: 5 },
        { id: 'cat_travel', name: 'Travel', budget: 15, balance: -20 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');

    // Open overview modal
    await page.click('#btn-overview');

    // Verify net deficit display and styling
    const totalBalance = page.locator('#overview-total-balance');
    await expect(totalBalance).toHaveText('-$15.00');
    await expect(totalBalance).toHaveClass(/text-orange-500/);
    await expect(page.locator('#overview-hero-card')).toHaveClass(/bg-orange-100/);
  });

  test('computes balanced state accurately when net is $0.00', async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 20, balance: 10 },
        { id: 'cat_travel', name: 'Travel', budget: 15, balance: -10 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');

    await page.click('#btn-overview');

    const totalBalance = page.locator('#overview-total-balance');
    await expect(totalBalance).toHaveText('+$0.00');
    await expect(page.locator('#overview-hero-card')).toHaveClass(/bg-sky-100/);
  });

  test('clicking a category in overview switches to that category tab and closes modal', async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 20, balance: 20 },
        { id: 'cat_travel', name: 'Travel', budget: 15, balance: -10 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');

    await expect(page.locator('#balance-display')).toHaveText('$20.00');

    // Open overview
    await page.click('#btn-overview');
    const modal = page.locator('#modal-overview');
    await expect(modal).not.toHaveClass(/opacity-0/);

    // Click Travel card in the list
    await page.locator('#overview-categories-list .category-overview-card', { hasText: 'Travel' }).click();

    // Modal should close
    await expect(modal).toHaveClass(/opacity-0/);

    // Active tab and display should now be Travel
    const activeTab = page.locator('#category-tabs-list .category-tab.active');
    await expect(activeTab).toContainText('Travel');
    await expect(page.locator('#balance-display')).toHaveText('$-10.00');
  });

  test('automatically displays overview modal after user confirms a category reset', async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 20, balance: 10 },
        { id: 'cat_travel', name: 'Travel', budget: 15, balance: -5 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');

    // Click Reset in hamburger menu
    await page.click('#btn-menu');
    await page.click('#btn-reset');
    const confirmModal = page.locator('#modal-confirm');
    await expect(confirmModal).not.toHaveClass(/opacity-0/);

    // Confirm reset
    await page.click('#btn-confirm-yes');
    await expect(confirmModal).toHaveClass(/opacity-0/);

    // Overview modal should pop up automatically showing pre-reset overview
    const overviewModal = page.locator('#modal-overview');
    await expect(overviewModal).not.toHaveClass(/opacity-0/);

    // Shows summary before reset subtitle
    await expect(page.locator('#overview-subtitle')).toHaveText('Summary before reset');

    // Pre-reset snapshot: Food balance $10 + Travel balance -$5 -> Total Net = +$5.00
    await expect(page.locator('#overview-total-balance')).toHaveText('+$5.00');
    await expect(page.locator('#overview-total-balance')).toHaveClass(/text-emerald-600/);

    // Verify category cards in pre-reset overview show pre-reset balances
    const cards = page.locator('#overview-categories-list .category-overview-card');
    await expect(cards.nth(0)).toContainText('Food');
    await expect(cards.nth(0)).toContainText('$10.00');
    await expect(cards.nth(1)).toContainText('Travel');
    await expect(cards.nth(1)).toContainText('-$5.00');

    // Dismiss overview
    await page.click('#btn-done-overview');
    await expect(overviewModal).toHaveClass(/opacity-0/);

    // Active category (Food) balance on dashboard is now reset to its budget ($20.00)
    await expect(page.locator('#balance-display')).toHaveText('$20.00');

    // Switch to Travel tab and verify it was also reset to its budget ($15.00)
    await page.locator('#category-tabs-list .category-tab', { hasText: 'Travel' }).click();
    await expect(page.locator('#balance-display')).toHaveText('$15.00');

    // Open overview again from header button: should now display post-reset state (20 + 15 = $35.00)
    await page.click('#btn-overview');
    await expect(overviewModal).not.toHaveClass(/opacity-0/);
    await expect(page.locator('#overview-subtitle')).toBeHidden();
    await expect(page.locator('#overview-total-balance')).toHaveText('+$35.00');
  });

  test('live updates overview when spending in a category', async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_food', name: 'Food', budget: 20, balance: 20 },
        { id: 'cat_travel', name: 'Travel', budget: 15, balance: -10 }
      ],
      activeCategoryId: 'cat_food'
    });
    await seedStorage(page, state);
    await page.goto('/');

    // Spend $15 on Food
    await page.fill('#tx-amount', '15.00');
    await page.fill('#tx-desc', 'Lunch');
    await page.click('#btn-spend');

    // Open overview and check updated values: (20 - 15) + (-10) = -5.00
    await page.click('#btn-overview');
    const totalBalance = page.locator('#overview-total-balance');
    await expect(totalBalance).toHaveText('-$5.00');
    await expect(totalBalance).toHaveClass(/text-orange-500/);
    await expect(page.locator('#overview-hero-card')).toHaveClass(/bg-orange-100/);
    await expect(page.locator('#overview-avg-used')).toHaveText('$15.00');
    await expect(page.locator('#overview-daily-total')).toHaveText('$35.00');
  });

});
