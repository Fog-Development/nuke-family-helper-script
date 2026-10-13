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

- [ ] A watch set to 0 xanax/hr (the faction pays its own way) never mentions
      xanax or pay: the bar says "this hour needs N more watchers", slots read
      "1/2 filled", and signups past the cap are "(extra)".
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

## Organized crimes (`factions.php` → crimes tab, own faction)

- [ ] Recruiting: every slot of a known crime shows a "Min CPR" line under
      its header: green when your CPR meets it, red when it does not, grey on
      filled slots. Role names are not truncated any more than Torn does itself.
- [ ] Recruiting, not in a crime: one slot is tagged "Best for you" (up to two
      more "Good for you") and the bar above the list names the same slot. "Show
      me" scrolls to it.
- [ ] Recruiting, already in a crime: the bar says Torn is not letting you
      join and no slot is tagged. (This relies on Torn disabling every Join
      button while you are in a crime; check that is still what happens.)
- [ ] Scroll down so Torn loads more crimes: the new ones get their lines and
      the suggestion updates if one of them is better. Nothing flickers.
- [ ] Join or leave a slot, or watch someone else take the suggested one: the
      tags move without a reload.
- [ ] A crime with no role weights yet (a newly released one) still gets
      "Min CPR" lines and can be tagged; when it is the best slot the bar says
      it goes on CPR and level alone.
- [ ] First visit to Recruiting sends one `POST /oc/cpr` a few seconds in
      (network tab); reloading without your CPRs changing sends none.
- [ ] With a better slot in a crime further down than Torn has loaded, the
      bar names it and offers "Scroll down"; once it loads it is tagged, or
      the suggestion moves on if the slot was taken meanwhile.
- [ ] Planning (not staff): lines on every slot, no bar and no tags. Completed: nothing odd.
- [ ] Staff (Helper and above), Recruiting and Planning: filled slots with a
      problem show a flag under the Min CPR line: red "CPR 61 < 72", amber
      "Idle 27h", blue "Level 8 member". The bar counts them.
- [ ] "Flag settings": unticking a kind hides it; a number in "Not productive
      after" or "Under-levelled from" changes which slots are flagged for you
      only; blank goes back to the faction's. Survives a reload.
- [ ] A normal member never sees flags or "Flag settings".
- [ ] At or above the faction's request level, free to join, with nothing
      decent open at your level: the bar offers "Ask staff for a level N crime".
      Clicking it posts in the faction's Discord channel and the button gives
      way to a confirmation; asking again within 30 minutes is refused with
      the site's reason. With crime requests switched off on nuke.family the
      button never appears.
- [ ] With only crimes two or more levels below you open (the "too low level"
      gap on nuke.family) and crime requests available to you: no slot is
      tagged, and the bar says the open slots are below your level and offers
      the request button. With crime requests off (or you under their minimum
      level): the best of them is tagged "Best available", never "Good for you".
- [ ] In a slot staff would flag, with over 24 hours left on the crime:
      Recruiting shows a red "You are in ... but ..." line and tags better
      slots. With under 24 hours left, or in a fine slot, it does not.
- [ ] Change a minimum on nuke.family (Organized Crimes → OC Assistant): within
      about five minutes and a page reload the line shows the new number.
- [ ] On nuke.family (Organized Crimes → OC Assistant → "What members see in
      the script"), within a few minutes of saving:
  - "Use the OC Assistant" off: no bar, no tags, no crime request button;
        every role of a known crime shows a grey "Weight N%" line. Staff still
        get their flags and "Flag settings".
  - "Suggest slots to join" off: no "Best for you" tags and no "Best slot
        for you" line; minimums stay, and the crime request button is still
        offered when nothing decent is open.
  - "Warn members when their slot is a poor fit" off: in a slot staff would
        flag, the bar only says Torn is not letting you join.
  - Suggestions and warnings both off, then "Show the minimum CPR on each
        role" off: "Weight N%" lines replace "Min CPR". The site does not let
        that switch go off while either of the other two is on.
- [ ] "Productive days count from level" set to 7: in a crime below level 7
      nobody gets the "Idle Nh" staff flag, your own slot is not called
      unproductive, and a suggested slot there says nothing about when
      planning would start (it points at the crime closest to full). Level 7
      and above behave as before. Set to "Never": the same at every level.
- [ ] Another faction's crimes tab is untouched.

## Ranked war board (`factions.php?step=your#/war/rank`, during a ranked war; also other factions' war pages)

Needs a ranked war on (or matched to start within a day) and nuke.family
having synced it (every 15 minutes). The automated tests build the member lists
from a capture of a real war, but only this pass sees Torn redraw them live.
Switch off "Torn War Stuff Enhanced" first: it sorts the same lists and the
two would keep undoing each other.

- [ ] A "War board" bar appears above the war list, reading "Live" within a
      few seconds; it appears on no other faction tab and on no other war type.
- [ ] Members in hospital show a countdown in place of "Hospital"; it ticks
      every second and matches their profile. Travellers show where they are
      ("MX") or which way they are flying ("► JP", "◄ SA").
- [ ] With "Hospital" selected both lists read: okay first, then hospital by
      time left, then travellers. A stay under five minutes is tinted green.
- [ ] With "Hospital" selected, the "then" select reorders the okay members:
      lowest or highest stats, highest or lowest score (the Score column), or
      latest out of hospital. Hospital rows stay in order of time left. The
      choice survives a reload, and the select is absent for the other sorts.
- [ ] Hospitalise or revive someone: their row moves within a second or two,
      and a revived member is tinted orange at the top for ten seconds.
- [ ] With BSP or FF Scouter installed: "Stats ▲" / "Stats ▼" sort by the
      estimates that script shows, no extra badge is drawn over them, and a few
      seconds after the list fills in one `POST /war/estimates` per script goes
      out (Network tab). Reload: nothing is sent again.
- [ ] With both installed, "Estimates" in the bar chooses which one sorts.
- [ ] In a browser with neither installed, after the step above: opponents show
      a small estimate badge beside their name, the stat sorts work, and "Show
      stats" hides the badges. Before anyone has passed estimates on, the stat
      controls are absent.
- [ ] While FF Scouter's own filter or sort is active on a list, ours leaves
      that list's order alone.
- [ ] "Torn's order" stops the sorting (Torn's column headers work again) and
      keeps the countdowns. The choice survives a reload.
- [ ] The stat estimate does not cover the name or the attack link, on desktop
      and in TornPDA.
- [ ] Leave the war view (another tab, or back to the war list): the bar and
      every label go. Network tab: `/war/board` is asked about every five
      seconds while the view is open and visible, never otherwise.
- [ ] With no war on, the bar says so and `/war/board` is asked once.
- [ ] Another faction's war page (`factions.php?step=profile&ID=…#/war/rank`,
      a faction in a ranked war that is not yours): the same bar, countdowns
      and sorting within a few seconds, and `/war/board?faction_id=…` in the
      Network tab. On the page of a faction with no ranked war the bar says so.
      Going from one faction's war to another's shows the new war's statuses,
      never the old one's.

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
