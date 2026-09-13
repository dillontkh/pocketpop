// --- Modal Dialog Controllers ---
import {
    state,
    getActiveCategory,
    initSetupCategory,
    createCategory,
    updateCategory,
    updateActiveCategory,
    deleteCategory,
    setDefaultCategoryId,
    resetActiveCategory,
    resetAllCategories,
    setActiveCategoryId
} from './state.js';
import {
    els,
    updateUI,
    showMainView,
    setOnTabDeleteCallback,
    renderOverview,
    setOnOverviewCategorySelectCallback
} from './ui.js';
import { showError } from './formatters.js';

let confirmContext = { type: 'reset', catId: null };

// --- Overview Modal ---
export function openOverview() {
    if (!els.modalOverview || !els.modalOverviewContent) return;
    renderOverview();
    els.modalOverview.classList.remove('opacity-0', 'pointer-events-none');
    els.modalOverviewContent.classList.remove('scale-90');
    els.modalOverviewContent.classList.add('scale-100');
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function closeOverview() {
    if (!els.modalOverview || !els.modalOverviewContent) return;
    els.modalOverview.classList.add('opacity-0', 'pointer-events-none');
    els.modalOverviewContent.classList.remove('scale-100');
    els.modalOverviewContent.classList.add('scale-90');
}

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

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function syncDefaultCategoryDropdown() {
    if (!els.settingsDefaultCategory) return;
    const currentVal = els.settingsDefaultCategory.value;
    els.settingsDefaultCategory.innerHTML = '';

    const lastUsedOpt = document.createElement('option');
    lastUsedOpt.value = 'last_used';
    lastUsedOpt.textContent = 'Last Used';
    els.settingsDefaultCategory.appendChild(lastUsedOpt);

    const rows = els.settingsCategoriesList ? els.settingsCategoriesList.querySelectorAll('.category-row') : [];
    if (rows.length > 0) {
        rows.forEach(row => {
            const id = row.dataset.id;
            const nameInput = row.querySelector('.cat-name-input');
            const name = nameInput ? nameInput.value.trim() : '';
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = name || 'Untitled';
            els.settingsDefaultCategory.appendChild(opt);
        });
    } else {
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            els.settingsDefaultCategory.appendChild(opt);
        });
    }

    if (currentVal && els.settingsDefaultCategory.querySelector(`option[value="${currentVal}"]`)) {
        els.settingsDefaultCategory.value = currentVal;
    } else if (state.defaultCategoryId && state.categories.some(c => c.id === state.defaultCategoryId)) {
        els.settingsDefaultCategory.value = state.defaultCategoryId;
    } else {
        els.settingsDefaultCategory.value = 'last_used';
    }
}

function renderSettingsCategories() {
    if (!els.settingsCategoriesList) return;
    els.settingsCategoriesList.innerHTML = '';

    state.categories.forEach(cat => {
        const row = document.createElement('div');
        row.className = 'category-row bg-white p-2 sm:p-2.5 rounded-2xl toy-border toy-shadow-sm flex items-center gap-2 transition-all';
        row.dataset.id = cat.id;

        row.innerHTML = `
            <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 p-1 flex items-center justify-center select-none touch-none shrink-0" title="Drag to reorder">
                <i data-lucide="grip-vertical" class="w-4 h-4" stroke-width="2.5"></i>
            </div>
            <input type="text" class="cat-name-input flex-1 min-w-0 bg-gray-50 focus:bg-white rounded-xl border-2 border-gray-200 focus:border-gray-800 text-sm font-black p-2 sm:p-2.5 outline-none transition-colors" placeholder="Name" value="${escapeHtml(cat.name)}" maxlength="20">
            <div class="relative w-20 sm:w-24 shrink-0">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-black text-gray-300">$</span>
                <input type="number" class="cat-budget-input w-full bg-gray-50 focus:bg-white rounded-xl border-2 border-gray-200 focus:border-gray-800 text-sm font-black p-2 sm:p-2.5 pl-5 sm:pl-6 text-center outline-none transition-colors" placeholder="0" value="${cat.budget}" inputmode="decimal">
            </div>
            ${state.categories.length > 1 ? `
                <button type="button" class="btn-delete-row text-gray-400 hover:text-pink-500 hover:bg-pink-50 p-1.5 rounded-xl transition-colors shrink-0" title="Delete category" data-id="${cat.id}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            ` : `<span class="w-7 shrink-0"></span>`}
        `;

        // Real-time sync of category name with default category dropdown
        const nameInput = row.querySelector('.cat-name-input');
        nameInput.addEventListener('input', () => {
            if (els.settingsDefaultCategory) {
                const opt = els.settingsDefaultCategory.querySelector(`option[value="${cat.id}"]`);
                if (opt) opt.textContent = nameInput.value || 'Untitled';
            }
        });

        // Enter key moves from name input to budget input
        const budgetInput = row.querySelector('.cat-budget-input');
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                budgetInput.focus();
            }
        });

        budgetInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveSettings();
            }
        });

        // Delete button
        const deleteBtn = row.querySelector('.btn-delete-row');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                closeSettings();
                openConfirm('delete', cat.id);
            });
        }

        els.settingsCategoriesList.appendChild(row);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

let dragDropInitialized = false;

function initDragDrop() {
    if (dragDropInitialized || !els.settingsCategoriesList) return;
    dragDropInitialized = true;

    const container = els.settingsCategoriesList;
    let draggedItem = null;

    container.addEventListener('pointerdown', (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;

        const row = handle.closest('.category-row');
        if (!row) return;

        e.preventDefault();
        draggedItem = row;

        try {
            handle.setPointerCapture(e.pointerId);
        } catch (_) {}

        let startPointerY = e.clientY;
        const initialRowRect = draggedItem.getBoundingClientRect();
        let initialRowTop = initialRowRect.top;
        const itemHeight = initialRowRect.height;
        const section = container.closest('.bg-yellow-50') || container;

        // Lift card off the screen
        draggedItem.classList.remove('is-dropping');
        draggedItem.classList.add('is-dragging');
        draggedItem.style.transform = 'translateY(0px) scale(1.03) rotate(-1.2deg)';

        function onPointerMove(moveEvent) {
            if (!draggedItem) return;
            moveEvent.preventDefault();

            // Clamp deltaY within bounds (never cover column headers above container)
            const containerBox = container.getBoundingClientRect();
            const sectionBox = section.getBoundingClientRect();
            const rawDeltaY = moveEvent.clientY - startPointerY;
            const minDeltaY = containerBox.top - 2 - initialRowTop;
            const maxDeltaY = sectionBox.bottom - 4 - (initialRowTop + itemHeight);
            const clampedDeltaY = Math.max(minDeltaY, Math.min(maxDeltaY, rawDeltaY));

            draggedItem.style.transform = `translateY(${clampedDeltaY}px) scale(1.03) rotate(-1.2deg)`;

            const currentVisualCenterY = initialRowTop + itemHeight / 2 + clampedDeltaY;
            const allRows = [...container.querySelectorAll('.category-row')];
            const siblingRows = allRows.filter(r => r !== draggedItem);

            let afterElement = null;
            for (const sibling of siblingRows) {
                // Sibling true layout midpoint (accounting for any active FLIP transform)
                const style = window.getComputedStyle(sibling);
                const matrix = new DOMMatrixReadOnly(style.transform);
                const trueTop = sibling.getBoundingClientRect().top - matrix.m42;
                const mid = trueTop + sibling.offsetHeight / 2;

                if (currentVisualCenterY < mid) {
                    afterElement = sibling;
                    break;
                }
            }

            // Check if DOM position would change
            const currentNextSibling = draggedItem.nextElementSibling;
            const wouldChange = afterElement ? (currentNextSibling !== afterElement) : (currentNextSibling !== null);

            if (wouldChange) {
                // FLIP First: record previous tops of all siblings
                const prevRects = new Map();
                siblingRows.forEach(r => prevRects.set(r, r.getBoundingClientRect().top));

                const oldDomTop = draggedItem.getBoundingClientRect().top;

                // Move DOM element
                if (afterElement) {
                    container.insertBefore(draggedItem, afterElement);
                } else {
                    container.appendChild(draggedItem);
                }

                const newDomTop = draggedItem.getBoundingClientRect().top;
                const domDelta = newDomTop - oldDomTop;

                // Adjust pointer offsets so the card does not jump under cursor
                startPointerY += domDelta;
                initialRowTop += domDelta;
                const updatedMinDeltaY = containerBox.top - 2 - initialRowTop;
                const updatedMaxDeltaY = sectionBox.bottom - 4 - (initialRowTop + itemHeight);
                const updatedDeltaY = moveEvent.clientY - startPointerY;
                const updatedClampedDeltaY = Math.max(updatedMinDeltaY, Math.min(updatedMaxDeltaY, updatedDeltaY));
                draggedItem.style.transform = `translateY(${updatedClampedDeltaY}px) scale(1.03) rotate(-1.2deg)`;

                // FLIP Invert & Play for siblings
                siblingRows.forEach(sibling => {
                    const prevTop = prevRects.get(sibling);
                    const newTop = sibling.getBoundingClientRect().top;
                    const diff = prevTop - newTop;

                    if (diff !== 0) {
                        sibling.style.transition = 'none';
                        sibling.style.transform = `translateY(${diff}px)`;
                        sibling.offsetHeight; // Force reflow
                        sibling.style.transition = '';
                        sibling.style.transform = '';
                    }
                });
            }
        }

        function onPointerUp(upEvent) {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('blur', onPointerUp);
            handle.removeEventListener('lostpointercapture', onPointerUp);

            if (upEvent && upEvent.pointerId) {
                try {
                    if (handle.hasPointerCapture && handle.hasPointerCapture(upEvent.pointerId)) {
                        handle.releasePointerCapture(upEvent.pointerId);
                    }
                } catch (_) {}
            }

            if (!draggedItem) return;
            const landingItem = draggedItem;
            draggedItem = null;

            // Landing animation: smoothly drop into place
            landingItem.classList.remove('is-dragging');
            landingItem.classList.add('is-dropping');
            landingItem.style.transform = 'translateY(0px) scale(1) rotate(0deg)';

            setTimeout(() => {
                landingItem.classList.remove('is-dropping');
                landingItem.style.transform = '';
            }, 200);

            syncDefaultCategoryDropdown();
        }

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        window.addEventListener('blur', onPointerUp);
        handle.addEventListener('lostpointercapture', onPointerUp);
    });
}

// --- Settings Modal ---
export function openSettings() {
    if (!state.categories || state.categories.length === 0) return;

    renderSettingsCategories();
    initDragDrop();
    syncDefaultCategoryDropdown();

    els.modalSettings.classList.remove('opacity-0', 'pointer-events-none');
    els.modalSettingsContent.classList.remove('scale-90');
    els.modalSettingsContent.classList.add('scale-100');

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function closeSettings() {
    els.modalSettings.classList.add('opacity-0', 'pointer-events-none');
    els.modalSettingsContent.classList.remove('scale-100');
    els.modalSettingsContent.classList.add('scale-90');
}

export function handleSaveSettings() {
    if (!els.settingsCategoriesList) return;
    const rows = [...els.settingsCategoriesList.querySelectorAll('.category-row')];
    if (rows.length === 0) return;

    const rowData = [];

    for (const row of rows) {
        const id = row.dataset.id;
        const nameInput = row.querySelector('.cat-name-input');
        const budgetInput = row.querySelector('.cat-budget-input');
        const name = nameInput.value.trim();
        const budget = parseFloat(budgetInput.value);

        if (!name) {
            els.settingsErrorMsg.innerText = 'Enter a category name!';
            showError(els.settingsError);
            nameInput.focus();
            return;
        }

        if (isNaN(budget) || budget <= 0) {
            els.settingsErrorMsg.innerText = 'Amount must be > 0!';
            showError(els.settingsError);
            budgetInput.focus();
            return;
        }

        rowData.push({ id, name, budget });
    }

    // Check duplicate names
    const lowerNames = rowData.map(r => r.name.toLowerCase());
    if (new Set(lowerNames).size !== lowerNames.length) {
        els.settingsErrorMsg.innerText = 'Category names must be unique!';
        showError(els.settingsError);
        return;
    }

    // Update state.categories with new values and new order
    const catMap = new Map(state.categories.map(c => [c.id, c]));
    const newCategories = [];
    rowData.forEach(({ id, name, budget }) => {
        const cat = catMap.get(id);
        if (cat) {
            cat.name = name;
            cat.budget = budget;
            newCategories.push(cat);
        }
    });
    state.categories = newCategories;

    // Save default category
    if (els.settingsDefaultCategory) {
        const selectedDefault = els.settingsDefaultCategory.value;
        setDefaultCategoryId(selectedDefault === 'last_used' ? null : selectedDefault);
    } else {
        saveData();
    }

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
        const count = state.categories.length;
        els.confirmTitle.innerText = count > 1 ? 'Reset All Categories?' : 'Reset Budget?';
        els.confirmMessage.innerText = count > 1
            ? 'This will clear all transactions and reset balances to daily budget across all categories. Continue?'
            : `This will clear transactions and reset balance to daily budget for "${activeCat ? activeCat.name : 'this category'}". Continue?`;
        els.btnConfirmYes.innerText = count > 1 ? 'Reset All' : 'Reset';
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
    if (els.btnSettings) els.btnSettings.addEventListener('click', openSettings);
    const editBtn = els.btnEditCategory || els.btnEditBudget;
    if (editBtn) editBtn.addEventListener('click', openSettings);
    if (els.btnCloseSettings) els.btnCloseSettings.addEventListener('click', closeSettings);
    if (els.btnSaveSettings) els.btnSaveSettings.addEventListener('click', handleSaveSettings);


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
                closeConfirm();
            } else {
                resetAllCategories();
                updateUI();
                closeConfirm();
                setTimeout(() => {
                    openOverview();
                }, 150);
            }
        });
    }

    // Connect tab delete button trigger to openConfirm
    setOnTabDeleteCallback((catId) => {
        openConfirm('delete', catId);
    });

    // Overview Modal listeners
    if (els.btnOverview) els.btnOverview.addEventListener('click', openOverview);
    if (els.btnCloseOverview) els.btnCloseOverview.addEventListener('click', closeOverview);
    if (els.btnDoneOverview) els.btnDoneOverview.addEventListener('click', closeOverview);
    if (els.modalOverview) {
        els.modalOverview.addEventListener('click', (e) => {
            if (e.target === els.modalOverview) closeOverview();
        });
    }

    setOnOverviewCategorySelectCallback((catId) => {
        setActiveCategoryId(catId);
        updateUI();
        closeOverview();
    });

    // Global keyboard listener
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNewCategory();
            closeSettings();
            closeConfirm();
            closeOverview();
        }
    });
}
