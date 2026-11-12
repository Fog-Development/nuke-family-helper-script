# UI test harness

Automated checks for the injected UI, run in headless Chromium (Playwright)
against **captures of real Torn pages**, styled with Torn's real CSS, in both
Torn themes.

```bash
npm install
npx playwright install chromium   # once
git clone <private fixtures repo> fixtures   # once: the captured pages (below)
npm test                          # runs test/**/*.test.mjs (Node 20+, any OS)
npm test -- hospital              # only test files whose path contains "hospital"
```

Screenshots of each themed render are written to `test/screenshots/`
(gitignored) so they can be eyeballed (e.g. by Claude Code reading the PNGs).

## Fixtures: a private repository

The captured pages are real Torn pages (member names, balances, faction
details), so they are **not** in this public repository. They live in a
private repository cloned into `fixtures/` (gitignored here), or anywhere
`NFH_FIXTURES` points. Its README describes the layout and `meta.json`.

Without it, `npm test` still runs the unit and recorder tests and skips the
page tests with a note. `NFH_REQUIRE_FIXTURES=1` makes that an error, and CI
sets it whenever it can check the fixtures out (the `FIXTURES_TOKEN` secret).

Each fixture is `fixtures/pages/<id>/`: a `meta.json` (URL, title, notes,
theme, page width, other scripts seen, and per step the actions taken to get
there), the page at each step (`step-NN.html`), Torn's own network responses
during each step, and a screenshot of the real page. `npm run fixtures` lists
them, `npm run fixtures -- show <id>` shows one, `npm run fixtures -- wanted`
lists captures asked for and not done yet.

### Adding or refreshing a capture

Use the recorder (`tools/fixture-recorder/README.md`): `npm run recorder`, the
Firefox extension loaded, the userscript turned off. Capture the page, or record
a scenario (each of your actions becomes a step). Then commit in `fixtures/`.

**Asking for a capture (Claude):** add an entry to `fixtures/wanted.json`
(`id`, `title`, `url`, `match` regex, `theme`, `layout`, `scenario`,
`instructions`, `"status": "open"`). The recorder shows it on matching pages and
marks it done when Justin captures it. Never open torn.com yourself.

## How it works

`test/harness/torn.js` → `openTornPage(browser, { page, step, theme, api, ... })`:

1. Serves the fixture step's HTML at the real Torn URL it was captured at (so
   `IsPage()` matches). Torn's stylesheets come from `fixtures/torn-css/`
   (saved by the recorder; `npm run fixtures:css` can fetch missing ones). Every
   other request gets an empty 200, so tests never touch the network.
2. Stubs the userscript-manager APIs (`GM_getValue/SetValue/xmlhttpRequest/info`).
   `GM_xmlhttpRequest` is answered from `test/fixtures/api/default.json`
   (`"METHOD /path": body`), overridable per test via the `api` option.
   A missing route returns 404, which usually surfaces as a console error and
   fails the test, so new API calls must get a fixture.
3. Builds the current `src/` in memory (same options as `npm run build`) and
   injects it. Torn's own JavaScript is not run (captured script tags are made
   inert), so pages are static.
4. Sets the theme. Torn's dark mode is a `dark-mode` class on `<body>`; light is
   its absence. `setTheme(page, "dark" | "light")` can also flip it live.
   Toggling the class on a dark capture matches a real light-mode capture to
   within ~1% of pixels, so one capture per page is usually enough. Capture a
   `-light` version of a new page once to confirm that holds there.

Stepping through a recorded scenario: `gotoStep(page, id, n)` swaps in step
`n`'s changed subtree (`changedRoot`) the way Torn's own re-render would, so
MutationObservers fire, and moves the URL hash to the step's. `loadNetwork(id, n)`
gives the responses Torn's page received during that step, for features that
read Torn's own data. `fixtureMeta(id)` / `listFixtures()` read the metadata.

Useful options: `localStorage` (seed warm caches), `gmValues`, `before(page)` to
tweak the DOM before the script runs (e.g. give the profile a faction link), and
`respond(status, body)` for non-200 API replies.

`test/harness/theme.js` has `measureContrast()`: WCAG contrast of an element's
text against the pixels actually painted behind it (Torn uses gradient images,
so `background-color` alone is not enough).

## Page contracts

`test/page-contracts.json` lists the Torn selectors each feature relies on, per
URL. `test/features/page-contracts.test.mjs` checks them against the fixtures
each one names; the recorder extension checks them on the live page and badges
a broken one. When a feature starts relying on new Torn markup, add it there.

## Writing a test for a new feature

See `test/features/shitlist-profile.test.mjs`. Loop over `THEMES`, assert the
injection, assert contrast on new text, save a screenshot. Add any new API route
the feature calls to `test/fixtures/api/default.json`.
`test/features/fixtures-smoke.test.mjs` already loads every fixture step in
both themes and fails on console errors or dialogs, so new features get a free
sanity check on every page.

## Limits

- The fixtures are snapshots: they catch injection, logic, escaping, theming and
  clashes with Torn's CSS, but not changes Torn makes to its markup after the
  capture, and not behaviour that depends on Torn's own scripts. Page contracts
  flag markup changes on the live page; re-capture then, and keep doing the
  quick real-site pass in `TESTING.md`.
- The seven fixtures from before the recorder (`source: "legacy-sanitized"`)
  have fake names and IDs (viewed player 1234 / faction 5678, logged-in user
  `TestUser` id 1) and no screenshot or network data. Tests depend on those
  fakes, so re-capturing one means updating its tests.
