# Manual test checklist

Run through this before bumping the version and committing a release build.
Load the script via `dev.user.js` (with `npm run watch` running) or install
the built `nuke-family-helper.user.js` directly.

Run `npm test` first (see `test/README.md`): it covers the shitlist profile
section, the faction-controls buttons and hospital row colouring in light and
dark mode against captured pages, and smoke-tests every captured page. The items below are the
real-site pass; do each UI check in both Torn light and dark mode.

## Setup / token flow

- [ ] With no `apiToken` stored (`GM_setValue("apiToken", "")` +
      `GM_setValue("apiTokenFirstTime", false)` from the userscript manager
      console, or a fresh browser profile): loading a Torn page shows the
      first-run confirm. OK navigates **the same tab** to
      https://nuke.family/auth/token-generation (no popup-blocker warning);
      Cancel stays put, and the next page load falls back to the manual prompt.
- [ ] On the token-generation page, **no** first-run alert/confirm appears.
- [ ] Generating a token shows a single "token saved" alert, stores it (check
      `GM_getValue("apiToken")`), and returns you to the Torn page you started
      from.
- [ ] Visiting the token-generation page directly (not via the first-run flow)
      and generating a token saves it and says "You can now close this tab"
      without redirecting.

## Profile pages (`torn.com/profiles.php?XID=...`)

- [ ] "Nuke Family Shitlist" section appears below the profile status box.
- [ ] A player with shitlist entries shows the entries (reason, category,
      updated time); the section is tinted red/bordered.
- [ ] A player in a friendly-flagged faction shows the green friendly styling.
- [ ] The settings cog opens the panel; unchecking a category hides its
      entries and shows the "N entries hidden by category settings" note;
      faction-ban categories are locked on.
- [ ] "Add to Shitlist" shows the warning dialogue, then the form; submitting
      with a category + reason succeeds (check the entry appears on
      nuke.family, with the correct reporter name/ID).
- [ ] Submitting with no category or empty reason shows the validation error.
- [ ] A player whose faction has an active revive contract shows the "Active
      Contract" section with the rules.
- [ ] "Nuke Family Reputation" box appears (when enabled in settings) with the
      paid-revives count; toggling it off in settings removes it.
- [ ] With the `recruiting.predict` permission: "Check Recruiting Score"
      button appears and clicking it renders the score breakdown.

## Hospital (`torn.com/hospitalview.php`)

- [ ] Rows are highlighted: teal (active contract), green (friendly faction),
      red (shitlisted player/faction).
- [ ] Highlighting persists as the hospital list refreshes/paginates.

## Chain watch (`factions.php?step=your`, main tab)

The automated tests stub the nuke.family API, so every item here needs a real
(or nuke.test) chain watch for your faction.

- [ ] With no chain watch for the faction: a single slim "Chain Watch · No
      chain watch scheduled" line sits under the war/chain boxes and cannot be
      expanded. Reloading within 10 minutes makes no `/chain-watch` request.
- [ ] With an active or upcoming watch: the line shows its title and what
      applies to you (start time, your next slot, people checked in).
      Expanding shows the roster (now / up next / then), who is checked in,
      and the hourly slots. The expanded state survives a reload.
- [ ] Pick an hour, "Sign up", then "Leave this slot": both show up on the
      nuke.family board and the Discord board. (Leaving is sent as a POST with
      `_method=DELETE`; confirm the site accepts it.)
- [ ] "Check in" / "Check out" from the collapsed line work, and the
      attendance page on nuke.family records them.
- [ ] Stay checked in past the end of a slot you signed up for: the line turns
      amber and asks "Still watching?"; "Stay on" clears it.
- [ ] As a helper or above: the search box finds a faction member by name or
      ID and checks them in/out; scheduled-but-absent members of the running
      hour have a "check in" shortcut. As a plain member none of that shows.
- [ ] "Test DM" delivers a Discord DM (and is throttled to one a minute).
- [ ] Chain timer alert: with it set to "Any active chain" (the default), the page
      flashes (and beeps, if enabled, after you have clicked the page once)
      while an active chain's timer is below the threshold, and stops when the
      chain is hit. A chain under 25 hits never alerts. With "Only chains with a chain watch" it stays quiet unless the faction
      has a watch on nuke.family; with "Only while I'm checked in" it also needs you checked
      in. The "Test" button previews it. Flashing never blocks clicks.
- [ ] With a chain watch running, an active chain and the alert armed, but not
      checked in: the line shows a small "Not checked in" note with a "Check
      in" button, and it goes away once checked in.
- [ ] Someone who used the old "Chain watcher" script gets their alert time,
      colour, beep and wall-marking settings carried over, and a note in the
      alert settings while the old script is still installed.
- [ ] "Mark wall targets" on a territory war wall strikes through your own
      members and highlights enemies.
- [ ] Switch to another faction tab and back: the line reappears once, and it
      does not appear on other factions' pages.

## Faction controls (`factions.php` → controls tab)

- [ ] "Change Nuke Family Key" and "Check NFH Updates" buttons appear.
- [ ] **Tab navigation:** browse to a different faction section (e.g. armoury)
      and back to controls — the buttons reappear **without a full page
      reload**, and are not duplicated. Repeat a few times.
- [ ] "Change Nuke Family Key" prompts and stores a new key; a too-short key is
      rejected. Cancelling makes no changes and shows no alert.
- [ ] "Check NFH Updates" refetches every cache (watch the network tab for
      `/shit-lists`, `/shit-list-categories`, `/contracts/get_contracts`,
      `/user/get-own-roles`, `/user/get-own-permissions`), then reports either
      "no updates" or the update prompt. The button is disabled and reads
      "Refreshing…" while it works.
- [ ] After a force refresh, a shitlist change made on nuke.family shows up on
      a profile page without waiting for the normal cache interval.

## General

- [ ] No errors in the browser console on profiles, hospital, and faction
      pages (warnings from Torn's own code excluded).
- [ ] Light and dark Torn themes both render the sections legibly.
- [ ] (If available) TornPDA: script loads and the profile shitlist section
      renders.
