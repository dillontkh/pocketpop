// --- Hamburger Menu Controller ---
import { els } from './ui.js';

let menuOpen = false;

export function isMenuOpen() {
    return menuOpen;
}

export function openMenu() {
    if (!els.menuDropdown || !els.btnMenu) return;
    menuOpen = true;
    els.menuDropdown.classList.remove('hidden');
    els.btnMenu.setAttribute('aria-expanded', 'true');
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function closeMenu() {
    if (!els.menuDropdown || !els.btnMenu) return;
    menuOpen = false;
    els.menuDropdown.classList.add('hidden');
    els.btnMenu.setAttribute('aria-expanded', 'false');
}

export function toggleMenu() {
    if (menuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
}

export function initMenu() {
    if (els.btnMenu) {
        els.btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });
    }

    // Close when clicking outside of menu container
    document.addEventListener('click', (e) => {
        if (menuOpen && els.menuContainer && !els.menuContainer.contains(e.target)) {
            closeMenu();
        }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) {
            closeMenu();
        }
    });
}
