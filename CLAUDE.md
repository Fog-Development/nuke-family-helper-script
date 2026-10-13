# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a userscript for the Nuke Family faction in the online game Torn. The script enhances the game interface with faction management tools including shitlist management, contract tracking, hospital row highlighting, reputation display, and ML recruiting scores. The script integrates with the Nuke.Family API and requires faction leadership permissions for most features.

The legacy "Payout Helper" features (cash payouts on faction controls, xanax payouts on the armoury drugs tab) were removed in the modular refactor — payouts are handled elsewhere now. Don't reintroduce them.

## Build System

The source lives in `src/` as ES modules and is bundled by esbuild into the single userscript file users install: `nuke-family-helper.user.js` at the repo root. **Never edit `nuke-family-helper.user.js` directly** — edit `src/` and rebuild. CI (`.github/workflows/verify-build.yml`) fails if the committed file doesn't match a fresh production build.

```bash
npm install          # once
npm run build        # production build (ALWAYS run before committing)
npm run watch        # rebuild on save (production settings)
npm run watch:debug  # rebuild on save with debug on (nuke.test API + console logging)
```

- The userscript metadata header is generated from `src/header.txt`; the `@version` comes from `version` in `package.json` (single source of truth).
- `__DEBUG__` and `__VERSION__` are compile-time defines injected by `build.mjs` (see `src/core/config.js`).
- Debug builds point at `http://nuke.test/api`. There is no hardcoded dev token; set one via the token-generation page on nuke.test or `GM_setValue("apiToken", "...")` from the userscript manager console.

## Development Workflow

For local testing, install `dev.user.js` in your userscript manager. It loads the built file from disk via `@require file://...`, so run `npm run watch` and reload the Torn page after each change. `dev.user.js` also matches `http://nuke.test/auth/token-generation` for testing the token flow against a local nuke.family instance.

Before releasing: run through `TESTING.md`, bump `version` in `package.json`, `npm run build`, commit `src/` and the regenerated `nuke-family-helper.user.js` together. Users install from the raw GitHub URL of the root file and the in-script update checker scrapes `@version` from it, so the built file must stay committed at that exact path.

## Automated UI tests

`npm test` runs Playwright (headless Chromium) against sanitized captures of real Torn pages (profile, faction tabs, hospital) styled with Torn's real CSS, in both light and dark mode, with `GM_*` and the nuke.family API stubbed. Setup once: `npx playwright install chromium`. Torn's CSS is committed in `test/fixtures/torn-css/`; `npm run fixtures:css` fetches stylesheets newly referenced by a fixture, `npm run fixtures:css:refresh` re-downloads everything on request. Screenshots land in `test/screenshots/` (gitignored); read them to check how new UI looks. When adding or changing UI, add/extend a test in `test/features/`, loop over `THEMES`, and add any new API route to `test/fixtures/api/default.json`. Never commit raw captures: new pages go through `npm run fixtures:sanitize` (see `test/README.md`). Fixtures are snapshots, so this does not replace the real-site pass in `TESTING.md`.

## Code Architecture

### Entry point and feature dispatch

`src/main.js` bootstraps the script. On the nuke.family token-generation page it only runs token capture and returns (the Torn-side bootstrap, including the first-run token prompt, must never run there). On Torn: PDA polyfill first, then styles, update check, cached-data load, API-token flow, and finally feature dispatch. A **feature** is a module exporting `{ name, pages: [PageType], init() }`. `dispatchFeatures()` runs `init()` for every feature whose page matches the current URL, both on load and on SPA navigation (`onNavigate` in `src/core/pages.js` hooks hashchange/popstate/pushState plus a deduped poll — Torn's faction page switches tabs via the location hash).

`init()` must be idempotent, and **must guard on DOM presence, not a module-level boolean**. Torn rebuilds whole tab panels when you navigate away and back, so a "already injected" flag stays set while the injected elements are gone — this was a real bug where faction-page buttons disappeared until a full reload. For containers the page may rebuild asynchronously, use `ensureInjected()` from `core/dom.js`, which re-checks on a short bounded schedule and repairs a wiped injection.

**To add a new feature:** create a module in `src/features/` exporting the descriptor, register it in the `features` array in `main.js`, and add a `@match` line in `src/header.txt` if it targets a URL not already matched.

### Core modules (`src/core/`)

- `pda-polyfill.js` — GM_* API polyfill for the TornPDA mobile app; must be imported first. Exports `isPda`.
- `config.js` — build-time constants: `DEBUG`, version, `API_URL`, GitHub update URL.
- `api.js` — `api(path, {method, data})`: promise-based, authenticated JSON calls to the nuke.family API via `GM_xmlhttpRequest`; throws `ApiError` with `.status`/`.body` on non-2xx. `request()` is the low-level wrapper.
- `auth.js` — API token storage (GM storage) and the first-run token acquisition flow. The first-run flow navigates the **current tab** to nuke.family (stashing the Torn URL in GM storage for the return trip) rather than using `window.open`, which popup blockers reject outside a click handler.
- `synced-store.js` + `cache-sync.js` — localStorage-backed stores (shitlist, categories, contracts) refreshed via the server's `/cache/last-updates` timestamps, with per-store TTL fallback. Store keys match the pre-refactor layout so existing installs keep their cache, except contracts, which moved to `contractCoverage` when it switched to `/contracts/active-coverage`. `refreshAllCaches()` force-refetches every store plus role and permissions (used by the "Check NFH Updates" button as a stale-data escape hatch); stores are registered in `main.js` before any feature runs so it always covers all of them.
- `pages.js` — `PageType` enum, URL matching (`IsPage`), navigation events (`onNavigate`).
- `torn-page.js` — scraping helpers for Torn's DOM (viewed player/faction, logged-in user via `uid` cookie).
- `settings.js` — user preferences (category visibility, reputation box) in localStorage.
- `user.js` — nuke.family role + permissions (12h cache) for gating UI, with `refreshUserRole()` / `refreshPermissions()` for forced refetches.
- `update-checker.js` — GitHub version check with 6h throttle and 3-day nag grace period.
- `dom.js` — `waitForElm`, `addStyle`, `escapeHtml`. **All API/user-sourced strings interpolated into innerHTML must go through `escapeHtml`.**

### Features (`src/features/`)

- `shitlist/` — data stores (`data.js`), profile section (`profile.js`), unified entry renderer (`render.js`), submission form + warning dialog (`form.js`), settings panel (`settings-panel.js`).
- `contracts.js` — coverage store (`/contracts/active-coverage`: each entry has an optional `faction_id` and optional `player_ids`, so player or group contracts need no script change), active-contract matching (UTC date parsing), profile "Active Contract" section (lists every rule when a contract has several).
- `hospital.js` — hospital row colour-coding (contract > friendly > shitlist).
- `reputation.js` / `recruiting.js` — profile reputation box and permission-gated ML recruiting score.
- `chain-watch/` — bar under the chain box on your own faction's main tab, driven by the nuke.family chain watch API (`/chain-watch…`): slot signup, self check-in/out, the slot-end "still watching?" answer, and staff check-in/out of other members (gated by `can_manage_attendance` from the board payload, not the cached role). Also the chain timer alert (flash + beep) that replaces the old standalone "Chain watcher" script, importing its `chainWarcher` settings. `data.js` API + caches, `view.js` pure HTML rendering, `alert.js` timer alert, `prefs.js` settings, `index.js` controller. This page is busiest during wars, so keep it cheap: the watch list is cached 10 min (most page loads make no request), polling only runs while the tab is visible, and regions are only rewritten when their HTML changed.
- `ranked-war/` — war board on your own faction's ranked war view (`#/war/rank`), driven by `/war/board` on nuke.family, which knows whether the faction is at war, reads both factions' member statuses from Torn once for everyone looking, and adds battle stat estimates when the faction has a Torn Stats key. The script never calls Torn's API. Status cells get a hospital countdown or travel label drawn over Torn's own text from a `data-nfh-war` attribute (Torn keeps rewriting the text, so it is never edited), and each list is kept sorted by status or by stat estimate (`prefs.js`, this browser only). `logic.js` holds the pure rules (unit tested): Torn's live cell beats the few-seconds-old API where they disagree. `index.js` is one 1s timer that only exists while that view is open, polls only while the tab is visible, writes an attribute only when it changed and moves rows only when the order is wrong. Cells are found by plain or build-hashed class (`status` / `status___…`). The bar reuses the chain watch bar's styles.
- `organized-crimes/` — OC Assistant on your own faction's crimes page, driven by the faction's config from nuke.family (`/oc/config`, a synced store keyed on `oc_config_cache_last_update`). Every slot gets a "Min CPR" line; on the Recruiting sub-tab the best slot to join is tagged and named in a bar above the list. A crime too new for the site to have weights (or any entry at all) is still suggested, on the level's fallback minimum and the member's CPR, ranked after an equal crime whose weights are known. `remote.js` sends the viewer's own CPRs (read from open slots, only when one changed) to `/oc/cpr` and caches the faction's board (`/oc/board`, one minute) so a better slot in a crime Torn has not lazy-loaded yet can be named in the bar. Staff (whoever the board sends `members` to; the site decides, not the cached role) get flags under filled slots on Recruiting and Planning: unqualified, not productive, under-levelled, each with its own colour and symbol, toggled and given personal thresholds in the bar's "Flag settings" (`prefs.js`, this browser only). A member sitting in a slot that would be flagged, in a crime with more than 24 hours left, is warned in the bar and shown better slots; that warning always uses the faction's thresholds. `flags.js` holds the pure flag rules (unit tested). When the faction allows it and the member is at or above its minimum level, a member free to join with nothing decent open at their level gets an "Ask staff for a level N crime" button (`POST /oc/spawn-request`; the site enforces the rules and a cooldown, and fog-bot posts it in Discord). `data.js` config store, `catalog.js` name-key lookups, `page.js` reads Torn's DOM (class names matched by prefix, planning progress from the slot clock's conic gradient), `scoring.js` pure rating and ranking (unit tested in `test/unit/`, so it must not import anything that needs the browser or build defines), `view.js` idempotent DOM upserts, `index.js` controller with a debounced MutationObserver on `#faction-crimes-root` (Torn lazy-loads and re-renders the list; mutations made only of our own elements are ignored). The full plan, including the steps not built yet, is `docs/oc-assistant-plan.md` in the site's repository.
- `faction-buttons.js` — "Change Nuke Family Key" and "Check NFH Updates" (which also force-refreshes all caches) on the faction controls page. This is the only settings surface outside the profile-page cog, and the first-run token alert points users here.
- `token-capture.js` — captures the API token on the nuke.family token-generation page and sends the user back to Torn if they arrived via the first-run flow. Not a registered feature; `main.js` calls `initTokenCapture()` directly.

### Conventions

- All injected elements use the `nfh-` CSS class prefix; styles live in `src/styles.css` (theme-aware via CSS variables).
- `LogInfo()` (in `core/log.js`) for debug logging — it's a no-op in production builds; don't use bare `console.log` except for real errors.
- localStorage keys are shared with the game's origin; GM storage (`GM_getValue`/`GM_setValue`) holds the API token.
