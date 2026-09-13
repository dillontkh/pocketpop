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
  * `sw.js` uses `__BUILD_HASH__`, stamped automatically with `github.sha` on master push via `.github/workflows/deploy.yml`.
  * `index.html` runs `reg.update()` on load to query new `sw.js`.
  * Service worker calls `skipWaiting()` and `clients.claim()` on activation.
  * Page listens for `controllerchange` event to display `#update-toast` (user-initiated reload).

## 🤖 Agent Instructions
* Keep all codebase modifications, scripts, documentation, and agent notes highly concise, precise, and information-dense.

## 💡 Development & Testing Lessons

* **State & Aggregations:**
  * Keep derived metrics (e.g., aggregate surplus/deficit, burn rates) computed on demand in `js/state.js` rather than persisting redundant calculated fields in `localStorage`.
  * Always call `saveState()` after mutating `pocketpop_data`.
  * Dynamic DOM injections containing `<i data-lucide="...">` require `if (window.lucide) window.lucide.createIcons();`.

* **Testing Patterns:**
  * Run the full Playwright test suite via `npm test` (uses the built-in server in `tests/server.js`).
  * Seed test states with `createTestState()` and `seedStorage(page, state)` from `tests/helpers.js` before `page.goto('/')`.
  * Never commit machine-specific or absolute filesystem paths into tests to maintain CI portability.

* **UI & Visual Verification:**
  * Modal dialogs use CSS transitions (`duration-200`). When capturing visual snapshots, wait for transitions to finish to prevent capturing semi-transparent frames.
  * Maintain Neubrutalist conventions: high-contrast dark borders (`border-gray-800`), offset drop shadows (`toy-shadow`), bold typography, and semantic color cues (emerald for surplus/under budget, orange for deficit/over budget).
  * Header uses `z-20` so the hamburger dropdown (`#menu-dropdown`) cleanly layers above the category tab bar (`z-10`).

