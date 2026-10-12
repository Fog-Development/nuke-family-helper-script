import { escapeHtml } from "../../core/dom.js";
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

const CHIP_STATES = ["ok", "below", "filled"];

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

// The "Min CPR 63" line under a slot's header.
export function renderMinimum(rated) {
  const { slot, minCpr } = rated;
  const existing = slot.el.querySelector(`:scope > .${CHIP_CLASS}`);
  const chip = chipFor(rated);

  if (!chip) {
    if (existing) existing.remove();
    return;
  }

  const element = existing || document.createElement("div");
  const text = `Min CPR ${minCpr}`;
  if (element.textContent !== text) element.textContent = text;
  if (element.title !== chip.title) element.title = chip.title;
  element.classList.add(CHIP_CLASS);
  for (const state of CHIP_STATES) {
    element.classList.toggle(`${CHIP_CLASS}--${state}`, state === chip.state);
  }
  if (!existing) slot.headerEl.insertAdjacentElement("afterend", element);
}

const TAG_TEXT = { [Rank.Best]: "Best for you", [Rank.Good]: "Good for you" };

function waitSentence(suggestion) {
  return `Your planning would start ${describeWait(suggestion.waitHours)}.`;
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
    const text = TAG_TEXT[suggestion.rank];
    if (tag.textContent !== text) tag.textContent = text;
    const title = waitSentence(suggestion);
    if (tag.title !== title) tag.title = title;
  }
}

// One line above the crime list saying where to go. `state` is one of:
//   { kind: "best", suggestions }  there is a slot to recommend
//   { kind: "none" }               open slots, but none the member qualifies for
//   { kind: "blocked" }            Torn is not letting the member join anything
//   { kind: "full" }               no open slot is loaded
export function barHtml(state) {
  const label = '<span class="nfh-oc-bar-label">OC Assistant</span>';

  if (state.kind === "best") {
    const [best, ...rest] = state.suggestions;
    const { slot, minCpr } = best.rated;
    const others = rest.filter((suggestion) => !suggestion.crime.offPage);
    const more =
      others.length > 0
        ? ` <span class="nfh-oc-bar-muted">${others.length} other good slot${others.length === 1 ? " is" : "s are"} marked below.</span>`
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
      : ' <span class="nfh-oc-bar-muted">Nothing open would start you sooner.</span>';
    return (
      `${label}<span class="nfh-oc-bar-text">Best slot for you: ` +
      `<strong>${escapeHtml(best.crime.name)}</strong> (level ${escapeHtml(best.crime.level ?? "?")}), ` +
      `<strong>${escapeHtml(slot.name)}</strong>. ` +
      `Your CPR is ${escapeHtml(slot.cpr)} and the minimum is ${escapeHtml(minCpr)}. ` +
      `${escapeHtml(waitSentence(best))}${late}${unweighted}${offPage}${more}</span>` +
      `<button type="button" class="nfh-oc-bar-button" data-nfh-oc-show>${best.crime.offPage ? "Scroll down" : "Show me"}</button>`
    );
  }

  const messages = {
    none:
      "None of the open slots loaded so far meets your faction's minimum CPR for you. " +
      "Scroll down to load more crimes.",
    blocked:
      "Torn is not letting you join a crime right now (you are probably already in one), " +
      "so no slot is suggested.",
    full: "No open slot is loaded yet. Scroll down to load more crimes.",
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
  for (const chip of root.querySelectorAll(`.${CHIP_CLASS}`)) chip.remove();
}

// True for an element this feature injected.
export function isOwnElement(node) {
  return (
    node.nodeType === Node.ELEMENT_NODE &&
    (node.classList.contains(CHIP_CLASS) || node.classList.contains(TAG_CLASS) || node.id === BAR_ID)
  );
}
