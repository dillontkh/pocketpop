// --- Rollover Logic ---
import { state, saveData } from './state.js';

export function processRollovers() {
    if (!state.categories || state.categories.length === 0) return;

    const now = new Date();
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let anyChanged = false;

    state.categories.forEach(category => {
        if (!category.lastLogin) return;
        const last = new Date(category.lastLogin);
        const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
        const daysPassed = Math.floor((nowMidnight - lastMidnight) / (1000 * 60 * 60 * 24));

        if (daysPassed > 0) {
            anyChanged = true;
            for (let i = 1; i <= daysPassed; i++) {
                const txId = lastMidnight + i * (24 * 60 * 60 * 1000);
                category.transactions.push({
                    id: txId,
                    amount: category.budget,
                    type: 'get',
                    desc: 'Daily Budget',
                    date: new Date(txId).toISOString()
                });
            }
            category.balance += (category.budget * daysPassed);
            category.lastLogin = now.toISOString();
        }
    });

    if (anyChanged) {
        saveData();
    }
}
