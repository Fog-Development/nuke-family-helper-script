# UI test harness

Automated checks for the injected UI, run in headless Chromium (Playwright)
against **sanitized captures of real Torn pages**, styled with Torn's real CSS,
in both Torn themes.

```bash
npm install
npx playwright install chromium   # once
npm run fixtures:css              # once (and after adding fixtures): downloads Torn's CSS
npm test                          # runs test/**/*.test.mjs
```

Screenshots of each themed render are written to `test/screenshots/`
(gitignored) so they can be eyeballed (e.g. by Claude Code reading the PNGs).
Without `fixtures:css` the tests still run, but pages render unstyled and the
contrast/screenshot checks are meaningless.

## How it works

`test/harness/torn.js` → `openTornPage(browser, { page, theme, api, ... })`:

1. Serves `test/fixtures/pages/<page>.html` at the real Torn URL listed in
   `fixtures/pages/manifest.json` (so `IsPage()` matches). Torn's stylesheets
   come from `fixtures/torn-css/`; every other request gets an empty 200, so
   tests never touch the network.
2. Stubs the userscript-manager APIs (`GM_getValue/SetValue/xmlhttpRequest/info`).
   `GM_xmlhttpRequest` is answered from `test/fixtures/api/default.json`
   (`"METHOD /path": body`), overridable per test via the `api` option.
   A missing route returns 404, which usually surfaces as a console error and
   fails the test, so new API calls must get a fixture.
3. Builds the current `src/` in memory (same options as `npm run build`) and
   injects it. Torn's own JavaScript is not part of the fixtures, so pages are
   static snapshots: tab switches etc. are simulated by changing the URL hash or
   mutating the DOM in the test.
4. Sets the theme. Torn's dark mode is a `dark-mode` class on `<body>`; light is
   its absence. `setTheme(page, "dark" | "light")` can also flip it live.
   Toggling the class on a dark capture matches a real light-mode capture to
   within ~1% of pixels (only live timers differ), so one capture per page is
   enough.

Useful options: `localStorage` (seed warm caches), `gmValues`, `before(page)` to
tweak the DOM before the script runs (e.g. give the profile a faction link), and
`respond(status, body)` for non-200 API replies.

`test/harness/theme.js` has `measureContrast()`: WCAG contrast of an element's
text against the pixels actually painted behind it (Torn uses gradient images,
so `background-color` alone is not enough).

## Fixtures

| fixture | URL | notes |
| --- | --- | --- |
| `profiles` | `profiles.php?XID=1234` | viewed player is factionless; use `before` to add a faction link |
| `factions-faction` | `factions.php?step=your#/` | |
| `factions-controls` | `factions.php?step=your#/tab=controls` | members/vault balances are fake |
| `factions-crimes-{recruiting,planning,completed}` | `#/tab=crimes` | sub-tabs share a URL; Torn loads them dynamically |
| `hospitalview` | `hospitalview.php` | |

### Adding or refreshing a capture

1. With the userscript **disabled** (so our own UI isn't in the capture), open the
   page in the theme and tab you want, wait for it to finish loading, then in
   DevTools run `copy(document.documentElement.outerHTML)` and save it as
   `<name>-dark.html` (and optionally `<name>-light.html`) in a directory
   **outside the repo**.
2. `npm run fixtures:sanitize -- <that dir>` writes sanitized fixtures to
   `test/fixtures/pages/`. It strips scripts and session data, replaces player/
   faction names and IDs and money amounts with consistent fakes (the viewed
   profile becomes player 1234 / faction 5678, the logged-in user becomes
   `TestUser`, id 1), and **refuses to write a file that still contains a real
   name/ID it replaced, a token-looking string, or anything in `<dir>/deny.txt`**
   (one string per line: your real name, etc.). The real→fake map is saved to
   `<dir>/sanitize-map.json`: keep it out of the repo.
3. Add the page's URL to `manifest.json`, run `npm run fixtures:css`, then look
   at the screenshots before committing: the automated check only knows the
   identifiers it has seen, so free text is worth a skim. Public Torn content
   (news ticker text, faction promo text, organized-crime story names) is left
   as is.

## Writing a test for a new feature

See `test/features/shitlist-profile.test.mjs`. Loop over `THEMES`, assert the
injection, assert contrast on new text, save a screenshot. Add any new API route
the feature calls to `test/fixtures/api/default.json`.
`test/features/fixtures-smoke.test.mjs` already loads every fixture in both
themes and fails on console errors or dialogs, so new features get a free
sanity check on every page.

## Limits

- The fixtures are snapshots: they catch injection, logic, escaping, theming and
  clashes with Torn's CSS, but not changes Torn makes to its markup after the
  capture, and not behaviour that depends on Torn's own scripts. Re-capture when
  Torn changes a page, and keep doing the quick real-site pass in `TESTING.md`.
- Short (< 3 character) faction tags and purely numeric names are not
  pseudonymized (they collide with ordinary text); they are public in Torn.
