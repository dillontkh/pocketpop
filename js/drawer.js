// --- History Drawer Controller ---
import { els } from './ui.js';

let drawerOpen = false;
let isDragging = false;
let startY = 0;
let currentOffset = 0;
let startTime = 0;
let maxTranslateY = 0;

export function updateDrawerUI(open) {
    drawerOpen = open;
    if (drawerOpen) {
        els.drawer.classList.remove('drawer-closed');
        els.drawer.classList.add('drawer-open');
        els.drawerIcon.style.transform = 'rotate(180deg)';
    } else {
        els.drawer.classList.remove('drawer-open');
        els.drawer.classList.add('drawer-closed');
        els.drawerIcon.style.transform = 'rotate(0deg)';
    }
}

export function initDrawer() {
    if (!els.drawerHeader || !els.drawer) return;

    els.drawerHeader.addEventListener('pointerdown', (e) => {
        // Only respond to primary button (left click / touch)
        if (e.button !== 0) return;
        
        isDragging = true;
        startY = e.clientY;
        startTime = Date.now();
        
        const drawerHeight = els.drawer.offsetHeight;
        maxTranslateY = drawerHeight - 64; // 64px is the 4rem header height
        currentOffset = drawerOpen ? 0 : maxTranslateY;
        
        els.drawer.style.transition = 'none';
        els.drawerHeader.setPointerCapture(e.pointerId);
    });

    els.drawerHeader.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        
        const deltaY = e.clientY - startY;
        let targetY = currentOffset + deltaY;
        
        // Constrain between 0 (fully open) and maxTranslateY (fully closed)
        if (targetY < 0) targetY = 0;
        if (targetY > maxTranslateY) targetY = maxTranslateY;
        
        els.drawer.style.transform = `translateY(${targetY}px)`;
    });

    const handlePointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        els.drawerHeader.releasePointerCapture(e.pointerId);
        els.drawer.style.transition = '';
        
        // Force layout reflow to make sure transition is registered
        els.drawer.offsetHeight;
        
        const deltaY = e.clientY - startY;
        const elapsedTime = Date.now() - startTime;
        const velocity = deltaY / elapsedTime; // positive is down (closing), negative is up (opening)
        
        // Check if it's a tap (very small movement)
        if (Math.abs(deltaY) < 5) {
            updateDrawerUI(!drawerOpen);
            els.drawer.style.transform = '';
            return;
        }
        
        // Snap logic
        let finalY = currentOffset + deltaY;
        if (finalY < 0) finalY = 0;
        if (finalY > maxTranslateY) finalY = maxTranslateY;
        
        let shouldOpen = drawerOpen;
        
        // Flick gesture
        if (velocity < -0.3) {
            shouldOpen = true;
        } else if (velocity > 0.3) {
            shouldOpen = false;
        } else {
            // Positional snap (50% threshold)
            shouldOpen = finalY < maxTranslateY / 2;
        }
        
        updateDrawerUI(shouldOpen);
        // Clear inline style to let CSS classes (drawer-open / drawer-closed) handle layout/responsiveness
        els.drawer.style.transform = '';
    };

    els.drawerHeader.addEventListener('pointerup', handlePointerUp);
    els.drawerHeader.addEventListener('pointercancel', handlePointerUp);
}
