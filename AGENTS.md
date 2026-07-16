# PocketPop Developer Notes for AI Agents

PocketPop is a neubrutalist PWA budget tracker deployed on GitHub Pages.

## 🛠️ PWA & Caching Architecture

* **Caching Strategy:**
  * Local origin assets: **Stale-While-Revalidate** in `sw.js` (instant offline load, background update).
  * External CDNs/Fonts: **Cache-First** with network fallback.
  * `sw.js`: Excluded from cache.
* **Update Rules (CRITICAL):**
  * **Increment `CACHE_NAME` version in `sw.js`** (e.g., `v1.1` -> `v1.2`) on any changes to local assets. This byte-change is required to trigger service worker updates on GitHub Pages.
  * `index.html` runs `reg.update()` on load to query new `sw.js`.
  * Service worker calls `skipWaiting()` and `clients.claim()` on activation.
  * Page listens for `controllerchange` event to display `#update-toast` (user-initiated reload).

## 🤖 Agent Instructions
* Keep all codebase modifications, scripts, documentation, and agent notes highly concise, precise, and information-dense.
