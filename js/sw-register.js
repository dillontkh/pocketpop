// --- Service Worker Registration & Update Toast ---
import { els } from './ui.js';

export function showUpdateToast() {
    if (els.updateToast) {
        els.updateToast.classList.remove('translate-y-[-150%]', 'opacity-0', 'pointer-events-none');
        els.updateToast.classList.add('translate-y-0', 'opacity-100');
    }
}

export function initServiceWorker() {
    if (els.btnUpdateReload) {
        els.btnUpdateReload.addEventListener('click', () => {
            window.location.reload();
        });
    }

    if ('serviceWorker' in navigator) {
        const hadController = !!navigator.serviceWorker.controller;

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('Service Worker registered successfully:', reg.scope);
                    // Force check for updates on load
                    reg.update().catch(() => {});
                })
                .catch(err => console.error('Service Worker registration failed:', err));
        });

        // Listen for changes to the active service worker
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            // Only show update prompt if the page was previously controlled (i.e. not the first load)
            if (hadController) {
                showUpdateToast();
            }
        });
    }
}
