// --- PocketPop Main Application Entrypoint ---
import { loadData, addTransaction } from './state.js';
import { processRollovers } from './rollover.js';
import { els, updateUI, showMainView, showSetupView } from './ui.js';
import { showError } from './formatters.js';
import { initDrawer } from './drawer.js';
import { initModals } from './modals.js';
import { initServiceWorker } from './sw-register.js';

function handleTransactionInput(type) {
    const amount = parseFloat(els.txAmount.value);
    if (isNaN(amount) || amount <= 0) {
        showError(els.txError);
        return;
    }

    const desc = els.txDesc.value.trim();
    addTransaction(type, amount, desc);

    // Clear inputs
    els.txAmount.value = '';
    els.txDesc.value = '';
    els.txAmount.blur(); // Hide virtual keyboard on mobile
    els.txDesc.blur();

    updateUI();
}

function initTransactionListeners() {
    if (els.btnSpend) els.btnSpend.addEventListener('click', () => handleTransactionInput('spend'));
    if (els.btnGet) els.btnGet.addEventListener('click', () => handleTransactionInput('get'));

    if (els.txAmount) {
        els.txAmount.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const amount = parseFloat(els.txAmount.value);
                if (isNaN(amount) || amount <= 0) {
                    showError(els.txError);
                    return;
                }
                els.txDesc.focus();
            }
        });
    }

    if (els.txDesc) {
        els.txDesc.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleTransactionInput('spend');
            }
        });
    }
}

function initLifecycleListeners() {
    // Auto-update balance when app returns to foreground or gets focus (e.g., resumed on mobile)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            processRollovers();
            updateUI();
        }
    });

    window.addEventListener('focus', () => {
        processRollovers();
        updateUI();
    });

    // Periodic check every 10 minutes in case the app remains continuously active on screen
    setInterval(() => {
        processRollovers();
        updateUI();
    }, 10 * 60 * 1000);
}

function init() {
    initDrawer();
    initModals();
    initTransactionListeners();
    initLifecycleListeners();
    initServiceWorker();

    const hasData = loadData();
    if (hasData) {
        processRollovers();
        showMainView();
    } else {
        showSetupView();
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Start application
init();
