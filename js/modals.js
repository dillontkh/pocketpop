// --- Modal Dialog Controllers ---
import {
    state,
    getActiveCategory,
    initSetupCategory,
    createCategory,
    updateActiveCategory,
    deleteCategory,
    resetActiveCategory
} from './state.js';
import { els, updateUI, showMainView, setOnTabDeleteCallback } from './ui.js';
import { showError } from './formatters.js';

let confirmContext = { type: 'reset', catId: null };

// --- Onboarding / Setup ---
export function handleSetupSubmit() {
    const catName = els.setupCatName.value.trim();
    const val = parseFloat(els.setupInput.value);

    if (!catName) {
        els.setupErrorMsg.innerText = 'Enter a category name!';
        showError(els.setupError);
        els.setupCatName.focus();
        return;
    }

    if (isNaN(val) || val <= 0) {
        els.setupErrorMsg.innerText = 'Amount must be > 0!';
        showError(els.setupError);
        els.setupInput.focus();
        return;
    }

    initSetupCategory(catName, val);
    showMainView();
}

// --- New Category Modal ---
export function openNewCategory() {
    els.newCatName.value = '';
    els.newCatBudget.value = '';
    els.modalNewCategory.classList.remove('opacity-0', 'pointer-events-none');
    els.modalNewCategoryContent.classList.remove('scale-90');
    els.modalNewCategoryContent.classList.add('scale-100');
    setTimeout(() => els.newCatName.focus(), 150);
}

export function closeNewCategory() {
    els.modalNewCategory.classList.add('opacity-0', 'pointer-events-none');
    els.modalNewCategoryContent.classList.remove('scale-100');
    els.modalNewCategoryContent.classList.add('scale-90');
}

export function handleCreateCategory() {
    const name = els.newCatName.value.trim();
    const budget = parseFloat(els.newCatBudget.value);

    if (!name) {
        els.newCatErrorMsg.innerText = 'Enter a category name!';
        showError(els.newCatError);
        els.newCatName.focus();
        return;
    }

    const duplicate = state.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        els.newCatErrorMsg.innerText = 'Category already exists!';
        showError(els.newCatError);
        els.newCatName.focus();
        return;
    }

    if (isNaN(budget) || budget <= 0) {
        els.newCatErrorMsg.innerText = 'Amount must be > 0!';
        showError(els.newCatError);
        els.newCatBudget.focus();
        return;
    }

    createCategory(name, budget);
    closeNewCategory();
    updateUI();
}

// --- Settings Modal ---
export function openSettings() {
    const activeCat = getActiveCategory();
    if (!activeCat) return;

    els.settingsCatName.value = activeCat.name;
    els.settingsInput.value = activeCat.budget;

    // Show/hide delete button depending on category count
    if (state.categories.length > 1) {
        els.btnDeleteCategory.classList.remove('hidden');
    } else {
        els.btnDeleteCategory.classList.add('hidden');
    }

    els.modalSettings.classList.remove('opacity-0', 'pointer-events-none');
    els.modalSettingsContent.classList.remove('scale-90');
    els.modalSettingsContent.classList.add('scale-100');
}

export function closeSettings() {
    els.modalSettings.classList.add('opacity-0', 'pointer-events-none');
    els.modalSettingsContent.classList.remove('scale-100');
    els.modalSettingsContent.classList.add('scale-90');
}

export function handleSaveSettings() {
    const activeCat = getActiveCategory();
    if (!activeCat) return;

    const name = els.settingsCatName.value.trim();
    const budget = parseFloat(els.settingsInput.value);

    if (!name) {
        els.settingsErrorMsg.innerText = 'Enter a category name!';
        showError(els.settingsError);
        els.settingsCatName.focus();
        return;
    }

    const duplicate = state.categories.some(c => c.id !== activeCat.id && c.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        els.settingsErrorMsg.innerText = 'Category already exists!';
        showError(els.settingsError);
        els.settingsCatName.focus();
        return;
    }

    if (isNaN(budget) || budget <= 0) {
        els.settingsErrorMsg.innerText = 'Amount must be > 0!';
        showError(els.settingsError);
        els.settingsInput.focus();
        return;
    }

    updateActiveCategory(name, budget);
    updateUI();
    closeSettings();
}

// --- Confirmation Modal ---
export function openConfirm(type = 'reset', catId = null) {
    confirmContext = { type, catId };
    const activeCat = getActiveCategory();

    if (type === 'delete') {
        const catToDelete = state.categories.find(c => c.id === catId) || activeCat;
        els.confirmTitle.innerText = 'Delete Category?';
        els.confirmMessage.innerText = `This will permanently remove "${catToDelete ? catToDelete.name : 'this category'}" and all of its transactions.`;
        els.btnConfirmYes.innerText = 'Delete';
    } else {
        els.confirmTitle.innerText = 'Reset?';
        els.confirmMessage.innerText = `This will clear transactions and reset balance to daily budget for "${activeCat ? activeCat.name : 'this category'}". Continue?`;
        els.btnConfirmYes.innerText = 'Reset';
    }

    els.modalConfirm.classList.remove('opacity-0', 'pointer-events-none');
    els.modalConfirmContent.classList.remove('scale-90');
    els.modalConfirmContent.classList.add('scale-100');
}

export function closeConfirm() {
    els.modalConfirm.classList.add('opacity-0', 'pointer-events-none');
    els.modalConfirmContent.classList.remove('scale-100');
    els.modalConfirmContent.classList.add('scale-90');
}

// --- Initialize Event Listeners ---
export function initModals() {
    // Setup listeners
    if (els.btnStart) els.btnStart.addEventListener('click', handleSetupSubmit);
    if (els.setupCatName) {
        els.setupCatName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                els.setupInput.focus();
            }
        });
    }
    if (els.setupInput) {
        els.setupInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSetupSubmit();
            }
        });
    }

    // New Category Modal listeners
    if (els.btnAddCategory) els.btnAddCategory.addEventListener('click', openNewCategory);
    if (els.btnCloseNewCat) els.btnCloseNewCat.addEventListener('click', closeNewCategory);
    if (els.btnCreateCategory) els.btnCreateCategory.addEventListener('click', handleCreateCategory);
    if (els.newCatName) {
        els.newCatName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                els.newCatBudget.focus();
            }
        });
    }
    if (els.newCatBudget) {
        els.newCatBudget.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateCategory();
            }
        });
    }
    if (els.modalNewCategory) {
        els.modalNewCategory.addEventListener('click', (e) => {
            if (e.target === els.modalNewCategory) closeNewCategory();
        });
    }

    // Settings Modal listeners
    const editBtn = els.btnEditCategory || els.btnEditBudget;
    if (editBtn) editBtn.addEventListener('click', openSettings);
    if (els.btnCloseSettings) els.btnCloseSettings.addEventListener('click', closeSettings);
    if (els.btnSaveSettings) els.btnSaveSettings.addEventListener('click', handleSaveSettings);
    if (els.settingsCatName) {
        els.settingsCatName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                els.settingsInput.focus();
            }
        });
    }
    if (els.settingsInput) {
        els.settingsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveSettings();
            }
        });
    }
    if (els.btnDeleteCategory) {
        els.btnDeleteCategory.addEventListener('click', () => {
            const activeCat = getActiveCategory();
            if (activeCat && state.categories.length > 1) {
                closeSettings();
                openConfirm('delete', activeCat.id);
            }
        });
    }
    if (els.modalSettings) {
        els.modalSettings.addEventListener('click', (e) => {
            if (e.target === els.modalSettings) closeSettings();
        });
    }

    // Confirm Modal listeners
    if (els.btnReset) els.btnReset.addEventListener('click', () => openConfirm('reset'));
    if (els.btnConfirmCancel) els.btnConfirmCancel.addEventListener('click', closeConfirm);
    if (els.modalConfirm) {
        els.modalConfirm.addEventListener('click', (e) => {
            if (e.target === els.modalConfirm) closeConfirm();
        });
    }

    if (els.btnConfirmYes) {
        els.btnConfirmYes.addEventListener('click', () => {
            if (confirmContext.type === 'delete') {
                deleteCategory(confirmContext.catId);
                updateUI();
            } else {
                resetActiveCategory();
                updateUI();
            }
            closeConfirm();
        });
    }

    // Connect tab delete button trigger to openConfirm
    setOnTabDeleteCallback((catId) => {
        openConfirm('delete', catId);
    });

    // Global keyboard listener
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNewCategory();
            closeSettings();
            closeConfirm();
        }
    });
}
