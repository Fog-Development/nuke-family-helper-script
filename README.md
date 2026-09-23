# nuke-family-helper-script
Making things easier for Nuke Family leadership. Don't bother trying to use this application unless you have leader permissions, you are required to use special keys generated from the site.

## Installation

Install [`nuke-family-helper.user.js`](https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js) in a userscript manager (Tampermonkey, Violentmonkey, or TornPDA).

## Development

The source is in `src/` (ES modules) and is bundled into the single installable file at the repo root. Do not edit `nuke-family-helper.user.js` by hand — CI verifies it matches a fresh build of `src/`.

```bash
npm install
npm run build        # production build → nuke-family-helper.user.js
npm run watch        # rebuild on save
npm run watch:debug  # rebuild on save, debug mode (nuke.test API + logging)
```

For local testing install `dev.user.js`, which loads the built file from disk (`@require file://...`) — run `npm run watch` and reload the page to pick up changes. See `CLAUDE.md` for architecture notes and `TESTING.md` for the pre-release manual test checklist.

### Releasing

1. Run through `TESTING.md`.
2. Bump `version` in `package.json`.
3. `npm run build`
4. Commit `src/` and the regenerated `nuke-family-helper.user.js` together, push to `master`.
