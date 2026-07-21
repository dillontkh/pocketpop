# PocketPop Developer Notes for AI Agents

PocketPop is a neubrutalist PWA budget tracker deployed on GitHub Pages.

## 🛠️ PWA & Caching Architecture

* **Caching Strategy:**
  * HTML / Navigation requests: **Network-First** in `sw.js` (instant updates when online, cached fallback when offline).
  * Other local assets: **Stale-While-Revalidate** in `sw.js` (icons, images).
  * External CDNs/Fonts: **Cache-First** with network fallback.
  * `sw.js`: Excluded from cache.
* **Update Rules:**
  * HTML updates auto-refresh on load via Network-First strategy.
  * Increment `CACHE_NAME` version in `sw.js` when modifying static assets or requiring hard cache purge.
  * `index.html` runs `reg.update()` on load to query new `sw.js`.
  * Service worker calls `skipWaiting()` and `clients.claim()` on activation.
  * Page listens for `controllerchange` event to display `#update-toast` (user-initiated reload).

## 🤖 Agent Instructions
* Keep all codebase modifications, scripts, documentation, and agent notes highly concise, precise, and information-dense.
