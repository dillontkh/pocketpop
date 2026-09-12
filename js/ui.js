// --- UI Rendering & DOM Elements ---
import { state, getActiveCategory, setActiveCategoryId, deleteTransaction } from './state.js';
import { formatTxDate, formatLastReset } from './formatters.js';

export const els = {
    viewSetup: document.getElementById('view-setup'),
    viewMain: document.getElementById('view-main'),
    
    setupCatName: document.getElementById('setup-cat-name'),
    setupInput: document.getElementById('setup-input'),
    setupError: document.getElementById('setup-error'),
    setupErrorMsg: document.getElementById('setup-error-msg'),
    btnStart: document.getElementById('btn-start'),
    
    categoryTabsList: document.getElementById('category-tabs-list'),
    btnAddCategory: document.getElementById('btn-add-category'),

    balanceDisplay: document.getElementById('balance-display'),
    dailyDisplay: document.getElementById('daily-amount-display'),
    btnReset: document.getElementById('btn-reset'),
    btnSettings: document.getElementById('btn-settings'),
    resetDateDisplay: document.getElementById('reset-date-display'),
    
    txAmount: document.getElementById('tx-amount'),
    txDesc: document.getElementById('tx-desc'),
    txError: document.getElementById('tx-error'),
    btnSpend: document.getElementById('btn-spend'),
    btnGet: document.getElementById('btn-get'),
    
    drawer: document.getElementById('history-drawer'),
    drawerHeader: document.getElementById('drawer-header'),
    drawerIcon: document.getElementById('drawer-icon'),
    historyList: document.getElementById('history-list'),

    // New Category Modal
    modalNewCategory: document.getElementById('modal-new-category'),
    modalNewCategoryContent: document.getElementById('new-category-modal-content'),
    newCatName: document.getElementById('new-cat-name'),
    newCatBudget: document.getElementById('new-cat-budget'),
    newCatError: document.getElementById('new-cat-error'),
    newCatErrorMsg: document.getElementById('new-cat-error-msg'),
    btnCreateCategory: document.getElementById('btn-create-category'),
    btnCloseNewCat: document.getElementById('btn-close-new-cat'),

    // Settings Modal
    modalSettings: document.getElementById('modal-settings'),
    modalSettingsContent: document.getElementById('settings-modal-content'),
    settingsDefaultCategory: document.getElementById('settings-default-category'),
    settingsCategoriesList: document.getElementById('settings-categories-list'),
    settingsError: document.getElementById('settings-error'),
    settingsErrorMsg: document.getElementById('settings-error-msg'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),

    // Confirmation Modal
    modalConfirm: document.getElementById('modal-confirm'),
    modalConfirmContent: document.getElementById('confirm-modal-content'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
    btnConfirmYes: document.getElementById('btn-confirm-yes'),

    // Update Toast
    updateToast: document.getElementById('update-toast'),
    btnUpdateReload: document.getElementById('btn-update-reload')
};

let onTabDeleteCallback = null;

export function setOnTabDeleteCallback(cb) {
    onTabDeleteCallback = cb;
}

export function showMainView() {
    els.viewSetup.classList.add('hidden');
    els.viewMain.classList.remove('hidden');
    updateUI();
}

export function showSetupView() {
    els.viewSetup.classList.remove('hidden');
    els.viewMain.classList.add('hidden');
}

export function renderCategoryTabs() {
    if (!els.categoryTabsList) return;
    els.categoryTabsList.innerHTML = '';

    state.categories.forEach(cat => {
        const isActive = cat.id === state.activeCategoryId;
        const tab = document.createElement('div');
        
        tab.className = isActive
            ? 'category-tab active bg-white text-gray-900 border-[3px] border-gray-800 border-b-white rounded-t-xl px-3.5 py-1.5 font-black text-sm flex items-center gap-2 cursor-pointer shadow-[2px_-2px_0px_0px_#1f2937] relative -mb-[3px] z-10 shrink-0 select-none'
            : 'category-tab bg-sky-200/90 hover:bg-sky-200 text-gray-700 border-[3px] border-gray-800 border-b-0 rounded-t-xl px-3 py-1.5 font-bold text-sm flex items-center gap-1.5 cursor-pointer shrink-0 select-none transition-colors -mb-[3px]';
        
        tab.dataset.catId = cat.id;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'truncate max-w-[110px]';
        nameSpan.textContent = cat.name;
        tab.appendChild(nameSpan);

        // Show close/delete button on tab if more than 1 category
        if (state.categories.length > 1) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors text-xs font-black shrink-0';
            closeBtn.innerHTML = '&times;';
            closeBtn.title = `Delete ${cat.name}`;
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (onTabDeleteCallback) {
                    onTabDeleteCallback(cat.id);
                }
            });
            tab.appendChild(closeBtn);
        }

        tab.addEventListener('click', () => {
            if (state.activeCategoryId !== cat.id) {
                setActiveCategoryId(cat.id);
                updateUI();
            }
        });

        els.categoryTabsList.appendChild(tab);
    });

    const activeEl = els.categoryTabsList.querySelector('.category-tab.active');
    if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
}

export function renderHistory() {
    const activeCat = getActiveCategory();
    if (!els.historyList) return;
    els.historyList.innerHTML = '';
    
    if (!activeCat || activeCat.transactions.length === 0) {
        els.historyList.innerHTML = `<div class="text-center text-gray-400 font-bold mt-8">No transactions yet!</div>`;
        return;
    }

    // Sort newest first
    const sorted = [...activeCat.transactions].sort((a, b) => b.id - a.id);

    sorted.forEach(tx => {
        const isSpend = tx.type === 'spend';
        const formattedDate = formatTxDate(tx.date || tx.id);
        const div = document.createElement('div');
        div.className = "bg-white p-3 rounded-2xl toy-border toy-shadow-sm flex justify-between items-center";
        
        div.innerHTML = `
            <div class="flex-1 overflow-hidden">
                ${formattedDate ? `<div class="text-[10px] font-bold text-gray-400 mb-0.5 tracking-tight">${formattedDate}</div>` : ''}
                <div class="font-black text-lg ${isSpend ? 'text-pink-500' : 'text-green-500'}">
                    ${isSpend ? '-' : '+'}$${tx.amount.toFixed(2)}
                </div>
                <div class="text-sm font-bold text-gray-500 truncate">${tx.desc || (isSpend ? 'Spent' : 'Received')}</div>
            </div>
            <button class="bg-gray-100 hover:bg-red-100 text-red-500 font-bold p-2 rounded-xl border-2 border-transparent hover:border-red-500 transition-colors shrink-0 delete-btn" data-id="${tx.id}">
                <i data-lucide="trash-2" class="w-5 h-5" stroke-width="3"></i>
            </button>
        `;
        els.historyList.appendChild(div);
    });

    // Attach delete listeners
    els.historyList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            deleteTransaction(id);
            updateUI();
        });
    });

    // Re-initialize dynamic Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function updateUI() {
    const activeCat = getActiveCategory();
    if (!activeCat) return;

    renderCategoryTabs();

    // Update Balance Color and Text
    els.balanceDisplay.innerText = `$${activeCat.balance.toFixed(2)}`;
    if (activeCat.balance < 0) {
        els.balanceDisplay.classList.remove('text-green-500', 'text-gray-800');
        els.balanceDisplay.classList.add('text-orange-500');
    } else if (activeCat.balance > 0) {
        els.balanceDisplay.classList.remove('text-orange-500', 'text-gray-800');
        els.balanceDisplay.classList.add('text-green-500');
    } else {
        els.balanceDisplay.classList.remove('text-orange-500', 'text-green-500');
        els.balanceDisplay.classList.add('text-gray-800');
    }

    els.dailyDisplay.innerText = `$${activeCat.budget}`;
    
    // Update last reset date indicator
    if (els.resetDateDisplay) {
        els.resetDateDisplay.innerText = formatLastReset(activeCat.lastReset);
    }

    // Update drawer title to include active category
    const drawerHeaderTitle = els.drawerHeader ? els.drawerHeader.querySelector('h3') : null;
    if (drawerHeaderTitle) {
        drawerHeaderTitle.innerText = `History (${activeCat.name})`;
    }
    
    renderHistory();
}
