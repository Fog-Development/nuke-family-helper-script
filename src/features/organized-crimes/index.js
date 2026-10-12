import { waitForElm } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { IsPage, PageType } from "../../core/pages.js";
import { ocConfigStore } from "./data.js";
import { activeSubTab, CRIMES_ROOT_SELECTOR, joinState, JoinState, readCrimes, SubTab } from "./page.js";
import { rateCrimes } from "./scoring.js";
import { barHtml, clearAll, isOwnElement, removeBar, renderBar, renderMinimum, renderSuggestions } from "./view.js";

// OC Assistant on your own faction's crimes page. Every slot shows the
// minimum CPR your faction asks for the role; on the Recruiting tab the slot
// where you are most useful is marked, using the faction's settings from
// nuke.family (see docs/oc-assistant-plan.md in the site's repository).
//
// Torn lazy-loads the crime list and re-renders it as members join, so the
// page is re-read whenever the list changes. Everything is worked out from
// what is on the page: no request is made here.

const RENDER_DEBOUNCE_MS = 150;

let observer = null;
let observedRoot = null;
let renderTimer = null;
let subscribed = false;

function isOwnFactionCrimesTab() {
  return window.location.search.includes("step=your") && IsPage(PageType.FactionCrimes);
}

function render() {
  const root = document.querySelector(CRIMES_ROOT_SELECTOR);
  if (!root || !isOwnFactionCrimesTab()) return;

  const config = ocConfigStore.data;
  if (!config) {
    clearAll(root);
    return;
  }

  const crimes = readCrimes(root);
  const result = rateCrimes(crimes, config);
  for (const crime of result.crimes) {
    for (const rated of crime.slots) renderMinimum(rated);
  }

  if (activeSubTab(root) !== SubTab.Recruiting || crimes.length === 0) {
    renderSuggestions(root, []);
    removeBar();
    return;
  }

  const joining = joinState(crimes);
  const suggestions = joining === JoinState.Open ? result.suggestions : [];
  renderSuggestions(root, suggestions);

  let state;
  if (joining === JoinState.Blocked) state = { kind: "blocked" };
  else if (joining === JoinState.Full) state = { kind: "full" };
  else if (suggestions.length === 0) state = { kind: "none" };
  else state = { kind: "best", suggestions };

  const bar = renderBar(root, barHtml(state));
  if (!bar.dataset.nfhBound) {
    bar.dataset.nfhBound = "1";
    bar.addEventListener("click", (event) => {
      if (!event.target.closest("[data-nfh-oc-show]")) return;
      const best = document.querySelector(`${CRIMES_ROOT_SELECTOR} .nfh-oc-pick--best`);
      if (best) best.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
}

function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    renderTimer = null;
    try {
      render();
    } catch (error) {
      console.error("[NFH] OC Assistant failed to render:", error);
    }
  }, RENDER_DEBOUNCE_MS);
}

// Our own chips and tags land inside the list being watched; a mutation made
// only of those must not trigger another render.
function isOwnMutation(mutation) {
  const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
  return nodes.length > 0 && nodes.every(isOwnElement);
}

function watch(root) {
  if (observedRoot === root && root.isConnected) return;
  if (observer) observer.disconnect();

  observedRoot = root;
  observer = new MutationObserver((mutations) => {
    if (!isOwnFactionCrimesTab()) return;
    if (mutations.every(isOwnMutation)) return;
    scheduleRender();
  });
  observer.observe(root, { childList: true, subtree: true });
  LogInfo("OC Assistant watching the crimes list");
}

function init() {
  if (!isOwnFactionCrimesTab()) return;

  // A store subscription is not page state, so a flag is safe here; the DOM
  // side below is re-checked on every call.
  if (!subscribed) {
    subscribed = true;
    ocConfigStore.subscribe(() => scheduleRender());
  }

  waitForElm(CRIMES_ROOT_SELECTOR).then((root) => {
    watch(root);
    scheduleRender();
  });
}

export default {
  name: "organized-crimes",
  pages: [PageType.FactionCrimes],
  init,
};
