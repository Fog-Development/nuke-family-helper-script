# NFH Fixture Recorder

A Firefox extension plus a small local server for capturing Torn pages as test
fixtures: the page's DOM at each step of something you do, what you clicked to
get there, Torn's own network responses, a full-page screenshot, the theme and
page width, and Torn's stylesheets. Captures go into the private fixtures
repository at `fixtures/` (see `fixtures/README.md` for the format).

## Torn's rules

Torn's Scripting Abuse rule bans anything that makes requests or takes actions
you didn't make yourself. The recorder only reads the page you're viewing:

- It never clicks, types, submits, scrolls or navigates anything, and never
  requests anything from Torn. You do every action yourself.
- Network capture keeps a copy of the responses your page already received
  (Firefox's `filterResponseData` passes every byte through unchanged). The
  copy stays in memory and only leaves it inside a capture you started.
- Captures go only to the companion server on `127.0.0.1`.
- Page contract checks are read-only `querySelector` calls, made only while
  the tab is visible. The only result is the badge on the recorder's pill;
  nothing alerts.

## Setup

1. In the script repository: `npm run recorder` and leave it running. It
   listens on `http://127.0.0.1:47821`.
2. Load the extension in Firefox, either way:
   - **Temporary** (lasts until Firefox restarts): `about:debugging` → This
     Firefox → Load Temporary Add-on → pick `tools/fixture-recorder/extension/manifest.json`.
     After changing the extension, press Reload there.
   - **Installed**: `npm run recorder:xpi`, then install
     `tools/fixture-recorder/dist/nfh-fixture-recorder.xpi` from
     `about:addons` → gear → Install Add-on From File. This needs a Firefox
     build that accepts unsigned add-ons (`xpinstall.signatures.required` =
     false in `about:config`).
3. Allow the add-on on torn.com if Firefox asks.
4. **Turn the Nuke Assistant userscript off** while capturing. Its UI would be
   in the capture, and the war board reorders rows. The panel warns if it sees
   our UI. Other scripts (BSP, FF Scouter, TornTools) are fine; the step
   records which ones were on the page.

## Using it

A "● Fixtures" pill sits bottom-left on Torn pages. Click it for the panel:

- **Captured for this page**: fixtures already taken of this page/tab (matched
  on the URL route, ignoring record ids like `ID=` or `start=`), with steps,
  theme, width and age. **Refresh** replaces one with a new capture.
  **Re-record** starts its scenario again.
- **Wanted here**: captures Claude has asked for that match this page. **Use**
  fills in the id, title and instructions. Then press Capture or Start
  scenario.
- **New capture**: the id defaults to one made from the URL (with `-light` /
  `-mobile` added when that applies). Add a title and notes for Claude.
  Screenshot and network capture can be switched off.
  - **Capture page** saves one step.
  - **Start scenario** saves step 0, then watches what you do. Each click,
    field change or tab switch is noted. Once the page settles (no elements
    added or removed for 0.8s), that becomes the next step. The step records
    your actions, the URL, and the smallest part of the page that changed, so
    tests can replay it with `gotoStep()`. **Snapshot now** (or Alt+Shift+S)
    takes a step by hand. "Auto step" can be turned off. **Finish** ends it.
    Stop before anything you don't want to happen for real: open the Kick
    dialog, then cancel it.
- **Page contracts**: the Torn markup our features depend on
  (`test/page-contracts.json`), checked on the page you're viewing. A red
  badge on the pill means one no longer matches: Torn changed the page. Tell
  Claude, and refresh the fixtures it lists.

Light mode: switch Torn's theme yourself and capture again (the id gets
`-light`). Page width: Firefox's Responsive Design Mode (Ctrl+Shift+M) at
under 784px gives the 386px TornPDA layout; the step records which layout it
was.

## After capturing

```bash
npm run fixtures                # what's there
npm run fixtures -- show <id>   # one fixture's steps
cd fixtures && git add -A && git commit -m "Capture ..." && git push
```

## Files

- `extension/manifest.json`, `background.js` (network copy, screenshots,
  server calls), `content.js` (the panel, capture, scenario, contracts)
- `server.mjs`: the companion server. It only accepts calls from the
  extension, never from web pages.
- `store.mjs`: the fixture layout, shared with the test harness.
- `cli.mjs` (`npm run fixtures`), `pack.mjs` (`npm run recorder:xpi`).
- Tests: `test/recorder/` (server, panel on a made-up page, network log).
  The background page's Firefox-only parts (`filterResponseData`,
  `captureTab`) can only be checked in Firefox itself.
