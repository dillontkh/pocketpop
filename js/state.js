// --- State Management ---

export const STORAGE_KEY = 'pocketpop_data';

export const state = {
    activeCategoryId: null,
    defaultCategoryId: null, // null / 'last_used' or specific category id
    categories: [] // Array of { id, name, budget, balance, lastLogin, lastReset, transactions }
};

export function getActiveCategory() {
    if (!state.categories || state.categories.length === 0) return null;
    let cat = state.categories.find(c => c.id === state.activeCategoryId);
    if (!cat) {
        cat = state.categories[0];
        state.activeCategoryId = cat.id;
    }
    return cat;
}

export function setActiveCategoryId(id) {
    state.activeCategoryId = id;
    saveData();
}

export function setDefaultCategoryId(id) {
    state.defaultCategoryId = id;
    saveData();
}

export function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
                state.categories = parsed.categories;
                state.defaultCategoryId = parsed.defaultCategoryId || null;
                state.activeCategoryId = parsed.activeCategoryId;
            } else if (parsed.budget !== undefined) {
                // Migrate legacy single-category state
                const legacyCatId = 'cat_' + Date.now();
                state.activeCategoryId = legacyCatId;
                state.defaultCategoryId = null;
                state.categories = [{
                    id: legacyCatId,
                    name: 'General',
                    budget: Number(parsed.budget) || 0,
                    balance: Number(parsed.balance) || 0,
                    lastLogin: parsed.lastLogin || new Date().toISOString(),
                    lastReset: parsed.lastReset || parsed.lastLogin || new Date().toISOString(),
                    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
                }];
                saveData();
            } else {
                return false;
            }

            // Ensure every category has required fields
            state.categories.forEach(cat => {
                if (!cat.lastReset) cat.lastReset = cat.lastLogin || new Date().toISOString();
                if (!Array.isArray(cat.transactions)) cat.transactions = [];
            });

            // If default category is set and valid, open to it on startup
            if (state.defaultCategoryId && state.defaultCategoryId !== 'last_used' && state.categories.some(c => c.id === state.defaultCategoryId)) {
                state.activeCategoryId = state.defaultCategoryId;
            } else if (!state.activeCategoryId || !state.categories.find(c => c.id === state.activeCategoryId)) {
                state.activeCategoryId = state.categories[0].id;
            }

            return true;
        } catch (err) {
            console.error('Failed to parse storage data:', err);
            return false;
        }
    }
    return false;
}

export function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function initSetupCategory(name, budget) {
    const catId = 'cat_' + Date.now();
    const now = new Date().toISOString();

    state.activeCategoryId = catId;
    state.defaultCategoryId = null;
    state.categories = [{
        id: catId,
        name: name,
        budget: budget,
        balance: budget, // Day 1 balance starts with daily budget
        lastLogin: now,
        lastReset: now,
        transactions: []
    }];

    saveData();
    return state.categories[0];
}

export function createCategory(name, budget) {
    const catId = 'cat_' + Date.now();
    const now = new Date().toISOString();
    const newCat = {
        id: catId,
        name: name,
        budget: budget,
        balance: budget,
        lastLogin: now,
        lastReset: now,
        transactions: []
    };

    state.categories.push(newCat);
    state.activeCategoryId = catId;
    saveData();
    return newCat;
}

export function updateCategory(catId, name, budget) {
    const cat = state.categories.find(c => c.id === catId);
    if (!cat) return null;

    cat.name = name;
    cat.budget = budget;
    saveData();
    return cat;
}

export function updateActiveCategory(name, budget) {
    const activeCat = getActiveCategory();
    if (!activeCat) return null;
    return updateCategory(activeCat.id, name, budget);
}

export function deleteCategory(catId) {
    const idx = state.categories.findIndex(c => c.id === catId);
    if (idx !== -1 && state.categories.length > 1) {
        state.categories.splice(idx, 1);
        if (state.activeCategoryId === catId) {
            state.activeCategoryId = state.categories[0].id;
        }
        if (state.defaultCategoryId === catId) {
            state.defaultCategoryId = null;
        }
        saveData();
        return true;
    }
    return false;
}

export function resetActiveCategory() {
    const activeCat = getActiveCategory();
    if (!activeCat) return null;

    activeCat.balance = activeCat.budget;
    activeCat.transactions = [];
    activeCat.lastLogin = new Date().toISOString();
    activeCat.lastReset = new Date().toISOString();
    saveData();
    return activeCat;
}

export function addTransaction(type, amount, desc) {
    const activeCat = getActiveCategory();
    if (!activeCat) return null;

    if (type === 'spend') {
        activeCat.balance -= amount;
    } else {
        activeCat.balance += amount;
    }

    const tx = {
        id: Date.now(),
        amount: amount,
        type: type,
        desc: desc,
        date: new Date().toISOString()
    };

    activeCat.transactions.push(tx);
    saveData();
    return tx;
}

export function deleteTransaction(txId) {
    const activeCat = getActiveCategory();
    if (!activeCat) return false;

    const txIndex = activeCat.transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) return false;

    const tx = activeCat.transactions[txIndex];

    // Reverse math
    if (tx.type === 'spend') {
        activeCat.balance += tx.amount;
    } else {
        activeCat.balance -= tx.amount;
    }

    activeCat.transactions.splice(txIndex, 1);
    saveData();
    return true;
}
