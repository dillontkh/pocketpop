// --- UI Rendering & DOM Elements ---
import { state, getActiveCategory, setActiveCategoryId, deleteTransaction, getBudgetOverview } from './state.js';
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
    btnMenu: document.getElementById('btn-menu'),
    menuDropdown: document.getElementById('menu-dropdown'),
    menuContainer: document.getElementById('menu-container'),
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

    // Overview Elements
    btnOverview: document.getElementById('btn-overview'),
    modalOverview: document.getElementById('modal-overview'),
    modalOverviewContent: document.getElementById('overview-modal-content'),
    btnCloseOverview: document.getElementById('btn-close-overview'),
    btnDoneOverview: document.getElementById('btn-done-overview'),
    overviewHeroCard: document.getElementById('overview-hero-card'),
    overviewSubtitle: document.getElementById('overview-subtitle'),
    overviewTotalBalance: document.getElementById('overview-total-balance'),
    overviewAvgUsed: document.getElementById('overview-avg-used'),
    overviewDailyTotal: document.getElementById('overview-daily-total'),
    overviewCategoriesList: document.getElementById('overview-categories-list'),

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

let onOverviewCategorySelectCallback = null;

export function setOnTabDeleteCallback() {}

export function setOnOverviewCategorySelectCallback(cb) {
    onOverviewCategorySelectCallback = cb;
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
        nameSpan.className = 'truncate max-w-[120px]';
        nameSpan.textContent = cat.name;
        tab.appendChild(nameSpan);

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

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let currentOverviewData = null;
let isShowingPreResetOverview = false;

export function clearOverviewData() {
    currentOverviewData = null;
    isShowingPreResetOverview = false;
    if (els.overviewSubtitle) {
        els.overviewSubtitle.innerText = '';
        els.overviewSubtitle.classList.add('hidden');
    }
}

export function renderOverview(data = null, options = {}) {
    if (!els.modalOverview) return;

    if (data && (data instanceof Event || typeof data.preventDefault === 'function')) {
        data = null;
    }

    if (options.isPostReset !== undefined) {
        isShowingPreResetOverview = !!options.isPostReset;
        currentOverviewData = isShowingPreResetOverview ? data : null;
    } else if (data) {
        currentOverviewData = data;
    } else if (!isShowingPreResetOverview) {
        currentOverviewData = getBudgetOverview();
    }

    const overview = currentOverviewData || getBudgetOverview();

    // 0. Update subtitle
    if (els.overviewSubtitle) {
        if (isShowingPreResetOverview) {
            els.overviewSubtitle.innerText = 'Summary before reset';
            els.overviewSubtitle.classList.remove('hidden');
        } else {
            els.overviewSubtitle.innerText = '';
            els.overviewSubtitle.classList.add('hidden');
        }
    }

    // 1. Total balance text & signs
    const formattedTotal = overview.totalNetBalance >= 0 
        ? `+$${overview.totalNetBalance.toFixed(2)}` 
        : `-$${Math.abs(overview.totalNetBalance).toFixed(2)}`;
    
    if (els.overviewTotalBalance) {
        els.overviewTotalBalance.innerText = formattedTotal;
    }

    // 2. Hero card styling
    if (els.overviewHeroCard) {
        els.overviewHeroCard.classList.remove('bg-emerald-100', 'bg-orange-100', 'bg-sky-100');
        els.overviewTotalBalance.classList.remove('text-emerald-600', 'text-orange-500', 'text-gray-800');

        if (overview.isSurplus) {
            els.overviewHeroCard.classList.add('bg-emerald-100');
            els.overviewTotalBalance.classList.add('text-emerald-600');
        } else if (overview.isDeficit) {
            els.overviewHeroCard.classList.add('bg-orange-100');
            els.overviewTotalBalance.classList.add('text-orange-500');
        } else {
            els.overviewHeroCard.classList.add('bg-sky-100');
            els.overviewTotalBalance.classList.add('text-gray-800');
        }
    }

    // 3. Avg used per day & total daily allowance
    if (els.overviewAvgUsed) {
        els.overviewAvgUsed.innerText = `$${overview.avgUsedPerDay.toFixed(2)}`;
        els.overviewAvgUsed.classList.remove('text-emerald-600', 'text-orange-500', 'text-gray-800');
        if (overview.avgUsedPerDay > overview.totalDailyBudget) {
            els.overviewAvgUsed.classList.add('text-orange-500');
        } else if (overview.avgUsedPerDay > 0) {
            els.overviewAvgUsed.classList.add('text-emerald-600');
        } else {
            els.overviewAvgUsed.classList.add('text-gray-800');
        }
    }
    if (els.overviewDailyTotal) {
        els.overviewDailyTotal.innerText = `$${overview.totalDailyBudget.toFixed(2)}`;
    }

    // 4. Categories breakdown list
    if (els.overviewCategoriesList) {
        els.overviewCategoriesList.innerHTML = '';

        if (overview.categories.length === 0) {
            els.overviewCategoriesList.innerHTML = `<div class="text-center text-gray-400 font-bold py-4">No categories created yet!</div>`;
        } else {
            overview.categories.forEach(cat => {
                const row = document.createElement('div');
                row.className = 'category-overview-card bg-white hover:bg-yellow-50 active:bg-yellow-100 rounded-xl px-3 py-2 toy-border toy-shadow-sm toy-interactive-sm flex items-center justify-between gap-2 cursor-pointer select-none transition-all';
                row.dataset.catId = cat.id;

                let balanceColor = 'text-gray-800';

                if (cat.status === 'under') {
                    balanceColor = 'text-emerald-600';
                } else if (cat.status === 'over') {
                    balanceColor = 'text-orange-500';
                } else {
                    balanceColor = 'text-gray-700';
                }

                const formattedBalance = cat.balance < 0 
                    ? `-$${Math.abs(cat.balance).toFixed(2)}` 
                    : `$${cat.balance.toFixed(2)}`;

                row.innerHTML = `
                    <div class="flex items-center gap-2 overflow-hidden min-w-0">
                        <span class="font-black text-sm text-gray-800 truncate">${escapeHtml(cat.name)}</span>
                        <span class="text-xs font-bold text-gray-400 shrink-0">+$${cat.budget}/day</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <span class="text-sm sm:text-base font-black ${balanceColor}">${formattedBalance}</span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400" stroke-width="3"></i>
                    </div>
                `;

                row.addEventListener('click', () => {
                    if (onOverviewCategorySelectCallback) {
                        onOverviewCategorySelectCallback(cat.id);
                    } else {
                        setActiveCategoryId(cat.id);
                        updateUI();
                    }
                });

                els.overviewCategoriesList.appendChild(row);
            });
        }
    }

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

    if (els.modalOverview && !els.modalOverview.classList.contains('opacity-0')) {
        renderOverview();
    }
}
