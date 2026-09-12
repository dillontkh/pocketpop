const { test, expect } = require('@playwright/test');
const { createTestState, seedStorage } = require('./helpers');

test.describe('Category Drag & Drop Reordering', () => {
  test.beforeEach(async ({ page }) => {
    const state = createTestState({
      categories: [
        { id: 'cat_daily', name: 'Daily', budget: 25 },
        { id: 'cat_food', name: 'Food', budget: 40 },
        { id: 'cat_transport', name: 'Transport', budget: 15 }
      ],
      activeCategoryId: 'cat_daily'
    });
    await seedStorage(page, state);
    await page.goto('/');
    await page.click('#btn-settings');
  });

  test('applies lifted styling when handle is grabbed', async ({ page }) => {
    const firstHandle = page.locator('#settings-categories-list .category-row:first-child .drag-handle');
    const firstRow = page.locator('#settings-categories-list .category-row:first-child');
    const box = await firstHandle.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    // Drag slightly to trigger is-dragging
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 10);

    await expect(firstRow).toHaveClass(/is-dragging/);

    await page.mouse.up();
    await expect(firstRow).not.toHaveClass(/is-dragging/);
  });

  test('clamps dragging strictly within the categories section', async ({ page }) => {
    const firstHandle = page.locator('#settings-categories-list .category-row:first-child .drag-handle');
    const firstRow = page.locator('#settings-categories-list .category-row:first-child');
    const section = page.locator('#settings-categories-list').locator('xpath=ancestor::div[contains(@class, "bg-yellow-50")]');
    const box = await firstHandle.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    // Drag far up (e.g. 300px into the header)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 300);

    const rowBoxUp = await firstRow.boundingBox();
    const sectionBox = await section.boundingBox();

    // The dragged row top must not escape above the section top
    expect(rowBoxUp.y).toBeGreaterThanOrEqual(sectionBox.y);

    // Drag far down (e.g. 500px onto the Save Settings button)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 500);

    const rowBoxDown = await firstRow.boundingBox();
    // The dragged row bottom must not escape past the section bottom
    expect(rowBoxDown.y + rowBoxDown.height).toBeLessThanOrEqual(sectionBox.y + sectionBox.height + 2);

    await page.mouse.up();
  });

  test('does not allow dragged category to cover Categories label or column headers', async ({ page }) => {
    const container = page.locator('#settings-categories-list');
    const firstHandle = container.locator('.category-row:first-child .drag-handle');
    const firstRow = container.locator('.category-row:first-child');
    const section = container.locator('xpath=ancestor::div[contains(@class, "bg-yellow-50")]');
    const columnHeaders = section.getByText('Category Name');

    const box = await firstHandle.boundingBox();
    const headersBox = await columnHeaders.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    // Drag far upward into the header
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 300);

    const draggedBox = await firstRow.boundingBox();

    // The dragged row top must stay at or below the column headers bottom
    expect(draggedBox.y).toBeGreaterThanOrEqual(headersBox.y + headersBox.height - 2);

    await page.mouse.up();
  });

  test('reorders category downwards and upwards and persists to dashboard', async ({ page }) => {
    const container = page.locator('#settings-categories-list');
    const dailyHandle = container.locator('.category-row:first-child .drag-handle');
    const box = await dailyHandle.boundingBox();

    // Drag Daily down to the bottom (past Food and Transport)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 190);
    await page.mouse.up();

    // Verify reordered list in settings
    const rowNamesAfterDown = await container.locator('.cat-name-input').evaluateAll(inputs => inputs.map(i => i.value));
    expect(rowNamesAfterDown).toEqual(['Food', 'Transport', 'Daily']);

    // Save and verify tabs on main dashboard
    await page.click('#btn-save-settings');
    const tabs = page.locator('#category-tabs-list .category-tab');
    await expect(tabs.nth(0)).toContainText('Food');
    await expect(tabs.nth(1)).toContainText('Transport');
    await expect(tabs.nth(2)).toContainText('Daily');
  });

  test('cleanly drops and resets when released outside the window', async ({ page }) => {
    const firstHandle = page.locator('#settings-categories-list .category-row:first-child .drag-handle');
    const firstRow = page.locator('#settings-categories-list .category-row:first-child');
    const box = await firstHandle.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 50);

    // Move cursor outside the browser viewport (negative coords)
    await page.mouse.move(-100, -100);
    await page.mouse.up();

    // Must reset without stuck dragging state
    await expect(firstRow).not.toHaveClass(/is-dragging/);
    await expect(firstRow).not.toHaveClass(/is-dropping/);
  });
});
