import { escapeHtml } from "../../core/dom.js";
import { Flag, FLAG_LABELS } from "./flags.js";
import { describeWait, Rank, SlotStatus } from "./scoring.js";

// Everything the feature draws on the crimes page: a minimum-CPR line under
// each slot's header (the header itself is too narrow: anything added there
// truncates the role name), a tag and outline on the suggested slots, and a summary bar
// above the list. Every function here is an upsert that only touches the DOM
// when something changed: Torn's list re-renders often, and our own writes
// must not feed the observer that watches it.

export const BAR_ID = "nfh-oc-bar";
const CHIP_CLASS = "nfh-oc-min";
const TAG_CLASS = "nfh-oc-tag";
const PICK_CLASS = "nfh-oc-pick";
const FLAGS_CLASS = "nfh-oc-flags";

// Each kind of flag gets its own symbol as well as its own colour, so they
// can be told apart without relying on colour.
const FLAG_SYMBOLS = { [Flag.Unqualified]: "\u2716", [Flag.Unproductive]: "\u23F3", [Flag.UnderLevel]: "\u2B07" };

const CHIP_STATES = ["ok", "below", "filled", "weight"];

function chipFor(rated) {
  const { slot, minCpr, weight, status, assumed } = rated;
  if (minCpr === null) return null;

  const weightNote =
    (weight === null
      ? " How much this role matters is not known yet."
      : ` This role carries ${weight.toFixed(1)}% of the crime's outcome.`) +
    (assumed ? " Your faction has not set a minimum for it, so this is the usual one for the crime's level." : "");
  switch (status) {
    case SlotStatus.Eligible:
      return {
        state: "ok",
        title: `Your CPR of ${slot.cpr} meets your faction's minimum of ${minCpr} for this role.${weightNote}`,
      };
    case SlotStatus.Below:
      return {
        state: "below",
        title: `Your CPR of ${slot.cpr} is below your faction's minimum of ${minCpr} for this role.${weightNote}`,
      };
    case SlotStatus.Filled:
      return { state: "filled", title: `Your faction's minimum CPR for this role is ${minCpr}.${weightNote}` };
    default:
      return null;
  }
}

// What a faction that has minimum CPRs hidden gets in their place.
function weightChipFor(rated) {
  if (rated.weight === null) return null;
  const weight = `${rated.weight.toFixed(1)}%`;
  return { state: "weight", text: `Weight ${weight}`, title: `This role carries ${weight} of the crime's outcome.` };
}

// The "Min CPR 63" line under a slot's header, or "Weight 13.5%" when the
// faction does not show its minimums.
export function renderMinimum(rated, showMinimum = true) {
  const { slot, minCpr } = rated;
  const existing = slot.el.querySelector(`:scope > .${CHIP_CLASS}`);
  const chip = showMinimum ? chipFor(rated) : weightChipFor(rated);

  if (!chip) {
    if (existing) existing.remove();
    return;
  }

  const element = existing || document.createElement("div");
  const text = chip.text || `Min CPR ${minCpr}`;
  if (element.textContent !== text) element.textContent = text;
  if (element.title !== chip.title) element.title = chip.title;
  element.classList.add(CHIP_CLASS);
  for (const state of CHIP_STATES) {
    element.classList.toggle(`${CHIP_CLASS}--${state}`, state === chip.state);
  }
  if (!existing) slot.headerEl.insertAdjacentElement("afterend", element);
}

// The flags under a filled slot (staff only). An empty list removes them.
export function renderFlags(slot, flags) {
  const existing = slot.el.querySelector(`:scope > .${FLAGS_CLASS}`);
  if (flags.length === 0) {
    if (existing) existing.remove();
    return;
  }

  const html = flags
    .map(
      (flag) =>
        `<span class="nfh-oc-flag nfh-oc-flag--${flag.flag}" title="${escapeHtml(`${FLAG_LABELS[flag.flag]}: ${flag.title}`)}">` +
        `<span aria-hidden="true">${FLAG_SYMBOLS[flag.flag]}</span> ${escapeHtml(flag.text)}</span>`,
    )
    .join("");

  const element = existing || document.createElement("div");
  if (element.dataset.nfhHtml !== html) {
    element.dataset.nfhHtml = html;
    element.innerHTML = html;
  }
  if (!existing) {
    element.className = FLAGS_CLASS;
    const anchor = slot.el.querySelector(`:scope > .${CHIP_CLASS}`) || slot.headerEl;
    anchor.insertAdjacentElement("afterend", element);
  }
}

// The staff part of the bar: how many of each flag are on the page, and the
// settings for which to show. `staff` is { counts, prefs, limits, open }.
export function staffHtml(staff) {
  const kinds = [Flag.Unqualified, Flag.Unproductive, Flag.UnderLevel];
  const shown = kinds.filter((kind) => staff.prefs.show[kind]);
  const summary =
    shown.length === 0
      ? "all hidden"
      : shown.map((kind) => `${staff.counts[kind] || 0} ${FLAG_LABELS[kind].toLowerCase()}`).join(", ");

  let panel = "";
  if (staff.open) {
    const toggles = kinds
      .map(
        (kind) =>
          `<label class="nfh-oc-staff-option"><input type="checkbox" data-nfh-oc-flag="${kind}"${staff.prefs.show[kind] ? " checked" : ""}> ` +
          `<span class="nfh-oc-flag nfh-oc-flag--${kind}"><span aria-hidden="true">${FLAG_SYMBOLS[kind]}</span> ${FLAG_LABELS[kind]}</span></label>`,
      )
      .join("");
    const override = (name, label, value, fallback) =>
      `<label class="nfh-oc-staff-option">${label} ` +
      `<input type="number" min="1" class="nfh-oc-staff-number" data-nfh-oc-limit="${name}" value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(fallback)}"></label>`;
    panel =
      `<div class="nfh-oc-staff-panel">${toggles}` +
      override("thresholdHours", "Not productive after (hours)", staff.prefs.thresholdHours, staff.factionLimits.thresholdHours) +
      override("levelGap", "Under-levelled from (levels below)", staff.prefs.levelGap, staff.factionLimits.levelGap) +
      '<span class="nfh-oc-bar-muted">Leave a number blank to use your faction\'s. These choices are yours alone.</span></div>';
  }

  return (
    `<span class="nfh-oc-staff"><span class="nfh-oc-bar-muted">Staff flags on this page:</span> ${escapeHtml(summary)} ` +
    `<button type="button" class="nfh-oc-bar-button" data-nfh-oc-staff-toggle aria-expanded="${staff.open ? "true" : "false"}">Flag settings</button></span>${panel}`
  );
}

const TAG_TEXT = { [Rank.Best]: "Best for you", [Rank.Good]: "Good for you" };
// A slot with something wrong with it is the best there is, not a good one.
const TAG_TEXT_FLAWED = { [Rank.Best]: "Best available", [Rank.Good]: "Also available" };

// What is wrong with a suggested slot, as the flags staff would put on a
// member who took it: [{ flag, text, title }]. Empty for a slot with nothing
// against it.
export function suggestionCaveats(suggestion) {
  const caveats = [];
  if (!suggestion.productive) {
    caveats.push({
      flag: Flag.Unproductive,
      text: `${Math.round(suggestion.waitHours)}h wait`,
      title:
        `Your planning would start ${describeWait(suggestion.waitHours)}, later than the ` +
        `${suggestion.thresholdHours} hours that count as productive.`,
    });
  }
  if (suggestion.belowLevel) {
    caveats.push({
      flag: Flag.UnderLevel,
      text: "Below your level",
      title: `This crime is below your level (${suggestion.memberLevel}).`,
    });
  }
  return caveats;
}

function waitSentence(suggestion) {
  return `Your planning would start ${describeWait(suggestion.waitHours)}.`;
}

// Why a slot is tagged. Where productive days do not count, the wait is
// beside the point.
function tagTitle(suggestion) {
  const caveats = suggestionCaveats(suggestion);
  if (caveats.length > 0) return caveats.map((caveat) => caveat.title).join(" ");
  return suggestion.pooled === false
    ? "Productive days do not count at this level, so this goes on your CPR and how close the crime is to full."
    : waitSentence(suggestion);
}

// Outline and tag the suggested slots, and clear the marks from any slot that
// is no longer suggested.
export function renderSuggestions(root, suggestions) {
  // A suggestion for a crime Torn has not loaded yet has no element to mark.
  const wanted = new Map(
    suggestions
      .filter((suggestion) => suggestion.rated.slot.el)
      .map((suggestion) => [suggestion.rated.slot.el, suggestion]),
  );

  for (const marked of root.querySelectorAll(`.${PICK_CLASS}`)) {
    if (wanted.has(marked)) continue;
    marked.classList.remove(PICK_CLASS, `${PICK_CLASS}--best`, `${PICK_CLASS}--good`);
    const tag = marked.querySelector(`:scope > .${TAG_CLASS}`);
    if (tag) tag.remove();
  }

  for (const [slotEl, suggestion] of wanted) {
    slotEl.classList.add(PICK_CLASS);
    slotEl.classList.toggle(`${PICK_CLASS}--best`, suggestion.rank === Rank.Best);
    slotEl.classList.toggle(`${PICK_CLASS}--good`, suggestion.rank === Rank.Good);

    let tag = slotEl.querySelector(`:scope > .${TAG_CLASS}`);
    if (!tag) {
      tag = document.createElement("div");
      tag.className = TAG_CLASS;
      slotEl.prepend(tag);
    }
    const caveats = suggestionCaveats(suggestion);
    const html =
      escapeHtml((caveats.length > 0 ? TAG_TEXT_FLAWED : TAG_TEXT)[suggestion.rank]) +
      caveats
        .map(
          (caveat) =>
            `<span class="nfh-oc-flag nfh-oc-flag--${caveat.flag}"><span aria-hidden="true">${FLAG_SYMBOLS[caveat.flag]}</span> ${escapeHtml(caveat.text)}</span>`,
        )
        .join("");
    if (tag.dataset.nfhHtml !== html) {
      tag.dataset.nfhHtml = html;
      tag.innerHTML = html;
    }
    const title = tagTitle(suggestion);
    if (tag.title !== title) tag.title = title;
  }
}

// The "ask staff for a crime" part of the bar. `spawn` is
// { tier, asked, busy, message, error, quiet }; `quiet` leaves out the reason,
// for when the bar has just given it.
export function spawnHtml(spawn) {
  if (spawn.message) {
    return `<span class="nfh-oc-spawn${spawn.error ? " nfh-oc-bar-warning" : ""}">${escapeHtml(spawn.message)}</span>`;
  }
  if (spawn.asked) {
    return '<span class="nfh-oc-spawn nfh-oc-bar-muted">You have asked staff for a crime. You can ask again later.</span>';
  }
  return (
    `<span class="nfh-oc-spawn">${spawn.quiet ? "" : '<span class="nfh-oc-bar-muted">Nothing decent is open at your level.</span> '}` +
    `<button type="button" class="nfh-oc-bar-button" data-nfh-oc-spawn${spawn.busy ? " disabled" : ""}>` +
    `${spawn.busy ? "Asking..." : `Ask staff for a level ${escapeHtml(spawn.tier)} crime`}</button></span>`
  );
}

// One line above the crime list saying where to go. `state` is one of:
//   { kind: "best", suggestions, warning }  there is a slot to recommend;
//                                  `warning` (optional) is what is wrong with
//                                  the slot the member already sits in
//   { kind: "warning", warning }   what is wrong with the member's own slot, for
//                                  a faction that warns but does not suggest
//   { kind: "none" }               open slots, but none the member qualifies for
//   { kind: "low" }                the member qualifies only for slots in crimes
//                                  below their level, and can ask staff for one
//   { kind: "joined", crime, level, role }  the member is in a crime already,
//                                  in a slot there is nothing wrong with
//   { kind: "blocked" }            Torn is not letting the member join anything
//   { kind: "full" }               no open slot is loaded
export function barHtml(state) {
  const label = '<span class="nfh-oc-bar-label">OC Assistant</span>';

  if (state.kind === "best") {
    const [best, ...rest] = state.suggestions;
    const { slot, minCpr } = best.rated;
    const others = rest.filter((suggestion) => !suggestion.crime.offPage);
    const flawed = suggestionCaveats(best).length > 0;
    const more =
      others.length > 0
        ? ` <span class="nfh-oc-bar-muted">${others.length} other ${flawed ? "" : "good "}slot${others.length === 1 ? " is" : "s are"} marked below.</span>`
        : "";
    const unweighted =
      best.rated.weight === null
        ? ' <span class="nfh-oc-bar-muted">This crime is too new to have role weights, so this goes on your CPR and its level alone.</span>'
        : "";
    const offPage = best.crime.offPage
      ? ' <span class="nfh-oc-bar-muted">It is further down the list and may have been taken in the last few minutes.</span>'
      : "";
    const late = best.productive
      ? ""
      : ` <strong class="nfh-oc-bar-warning">That is later than the ${escapeHtml(best.thresholdHours)} hours that count as productive,</strong>` +
        ' <span class="nfh-oc-bar-muted">but nothing open would start you sooner.</span>';
    const belowLevel = best.belowLevel
      ? ` <strong class="nfh-oc-bar-warning">This crime is below your level (${escapeHtml(best.memberLevel)}).</strong>`
      : "";
    let lead = flawed ? "Best slot available: " : "Best slot for you: ";
    if (state.warning) {
      lead = `<strong class="nfh-oc-bar-warning">${escapeHtml(state.warning)}</strong> ${flawed ? "The best slot available: " : "A better slot: "}`;
    }
    return (
      `${label}<span class="nfh-oc-bar-text">${lead}` +
      `<strong>${escapeHtml(best.crime.name)}</strong> (level ${escapeHtml(best.crime.level ?? "?")}), ` +
      `<strong>${escapeHtml(slot.name)}</strong>. ` +
      `Your CPR is ${escapeHtml(slot.cpr)} and the minimum is ${escapeHtml(minCpr)}. ` +
      `${best.pooled === false ? "" : escapeHtml(waitSentence(best))}${late}${belowLevel}${unweighted}${offPage}${more}</span>` +
      `<button type="button" class="nfh-oc-bar-button" data-nfh-oc-show>${best.crime.offPage ? "Scroll down" : "Show me"}</button>`
    );
  }

  if (state.kind === "joined") {
    return (
      `${label}<span class="nfh-oc-bar-text">You are in <strong>${escapeHtml(state.crime)}</strong> ` +
      `(level ${escapeHtml(state.level ?? "?")}) as <strong>${escapeHtml(state.role)}</strong>, so no other slot is suggested.</span>`
    );
  }

  if (state.kind === "warning") {
    return `${label}<span class="nfh-oc-bar-text"><strong class="nfh-oc-bar-warning">${escapeHtml(state.warning)}</strong></span>`;
  }

  const messages = {
    none:
      "None of the open slots loaded so far meets your faction's minimum CPR for you. " +
      "Scroll down to load more crimes.",
    blocked:
      "Torn is not letting you join a crime right now (you are probably already in one), " +
      "so no slot is suggested.",
    full: "No open slot is loaded yet. Scroll down to load more crimes.",
    low: "The open slots you qualify for are all in crimes below your level, so none is suggested.",
  };
  return `${label}<span class="nfh-oc-bar-text">${messages[state.kind]}</span>`;
}

// Put the bar just above Torn's crimes app, outside the part Torn re-renders.
export function renderBar(root, html) {
  let bar = document.getElementById(BAR_ID);
  if (!bar) {
    bar = document.createElement("div");
    bar.id = BAR_ID;
    bar.className = "nfh-oc-bar";
    root.parentElement.insertBefore(bar, root);
  }
  if (bar.dataset.nfhHtml !== html) {
    bar.dataset.nfhHtml = html;
    bar.innerHTML = html;
  }
  return bar;
}

export function removeBar() {
  const bar = document.getElementById(BAR_ID);
  if (bar) bar.remove();
}

// Take everything this feature drew back off the page.
export function clearAll(root) {
  removeBar();
  renderSuggestions(root, []);
  for (const ours of root.querySelectorAll(`.${CHIP_CLASS}, .${FLAGS_CLASS}`)) ours.remove();
}

// True for an element this feature injected.
export function isOwnElement(node) {
  return (
    node.nodeType === Node.ELEMENT_NODE &&
    (node.classList.contains(CHIP_CLASS) ||
      node.classList.contains(TAG_CLASS) ||
      node.classList.contains(FLAGS_CLASS) ||
      node.id === BAR_ID)
  );
}
