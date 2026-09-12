/**
 * PocketPop Test Helpers
 */

export function createTestState({
  categories = [
    { id: 'cat_daily', name: 'Daily', budget: 25, balance: 25, transactions: [] },
    { id: 'cat_food', name: 'Food', budget: 40, balance: 40, transactions: [] },
    { id: 'cat_transport', name: 'Transport', budget: 15, balance: 15, transactions: [] }
  ],
  activeCategoryId = 'cat_daily',
  defaultCategoryId = null
} = {}) {
  const today = new Date().toISOString();
  return {
    activeCategoryId,
    defaultCategoryId,
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      budget: c.budget,
      balance: c.balance ?? c.budget,
      lastLogin: today,
      lastReset: today,
      transactions: c.transactions ?? []
    }))
  };
}

export async function seedStorage(page, state) {
  await page.addInitScript((data) => {
    // Only seed once per tab/session so in-test page.reload() preserves test modifications
    if (!sessionStorage.getItem('__storage_seeded')) {
      sessionStorage.setItem('__storage_seeded', '1');
      localStorage.setItem('pocketpop_data', JSON.stringify(data));
    }
  }, state);
}
