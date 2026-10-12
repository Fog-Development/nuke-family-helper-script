import { waitForElm } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { IsPage, PageType } from "../../core/pages.js";
import { getUserscriptUsersPlayerId } from "../../core/torn-page.js";
import { ocConfigStore } from "./data.js";
import { crimeHoursLeft, limitsFor, slotFlags } from "./flags.js";
import { getStaffPrefs, parseOverride, setStaffPrefs } from "./prefs.js";
import { activeSubTab, CRIMES_ROOT_SELECTOR, joinState, JoinState, readCrimes, SubTab } from "./page.js";
import { cachedBoard, learnCprs, offPageCrimes, refreshBoard } from "./remote.js";
import { rateCrimes } from "./scoring.js";
import {
  barHtml,
  clearAll,
  isOwnElement,
  removeBar,
  renderBar,
  renderFlags,
  renderMinimum,
  renderSuggestions,
  staffHtml,
} from "./view.js";

// OC Assistant on your own faction's crimes page. Every slot shows the
// minimum CPR your faction asks for the role; on the Recruiting tab the slot
// where you are most useful is marked, using the faction's settings from
// nuke.family (see docs/oc-assistant-plan.md in the site's repository).
//
// Torn lazy-loads the crime list and re-renders it as members join, so the
// page is re-read whenever the list changes. The page is the truth for the
// crimes on it; the site's board (up to five minutes old, cached a minute
// here) only adds the recruiting crimes Torn has not loaded yet, so the best
// slot can be named before the member scrolls to it. Once such a crime loads,
// the page takes over and a slot that has gone is simply no longer suggested.

const RENDER_DEBOUNCE_MS = 150;
// A member is only told to move out of a bad slot while the crime still has
// more than this long to run; near the end it is not worth leaving.
const MOVE_WORTHWHILE_HOURS = 24;

let staffPanelOpen = false;

// What is wrong with the slot the viewer sits in, judged by the faction's own
// thresholds (never a staff member's), or null. Looks on the page first, then
// in the site's board, since the member's crime is usually on another tab.
function ownSlotWarning(pageCrimes, board, config, rate) {
  const me = String(getUserscriptUsersPlayerId() || "");
  if (!me) return null;

  const boardCrimes = ((board && board.crimes) || []).map((crime) => ({
    id: String(crime.id),
    name: crime.name,
    level: crime.level,
    slots: crime.slots.map((slot) => ({
      name: slot.role,
      occupied: slot.player_id !== null,
      playerId: slot.player_id === null ? null : String(slot.player_id),
      progress: slot.progress || 0,
      cpr: slot.cpr,
    })),
  }));

  for (const crime of [...pageCrimes, ...boardCrimes]) {
    const index = crime.slots.findIndex((slot) => slot.occupied && slot.playerId === me);
    if (index === -1) continue;
    if (crimeHoursLeft(crime) <= MOVE_WORTHWHILE_HOURS) return null;

    const rated = rate([crime], config).crimes[0].slots[index];
    const level = board && board.me ? board.me.level : null;
    const flags = slotFlags(crime, index, rated, level, limitsFor(config));
    if (flags.length === 0) return null;
    return `You are in ${crime.name} as ${crime.slots[index].name}, but: ${flags.map((flag) => flag.title).join(" ")}`;
  }
  return null;
}

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
  const tab = activeSubTab(root);
  const recruiting = tab === SubTab.Recruiting;
  const active = (recruiting || tab === SubTab.Planning) && crimes.length > 0;
  const joining = joinState(crimes);

  if (recruiting) learnCprs(crimes);
  // The board serves the crimes Torn has not loaded, the viewer's own slot
  // and (for staff) every member's level. Cached a minute.
  if (active) {
    refreshBoard().then((fresh) => {
      if (fresh) scheduleRender();
    });
  }
  const cached = active ? cachedBoard() : null;
  const board = cached ? cached.board : null;

  // In a slot staff would flag, with long enough left to be worth moving:
  // the member is warned and shown better slots even though Torn has the
  // Join buttons disabled until they leave.
  const warning = recruiting && joining === JoinState.Blocked ? ownSlotWarning(crimes, board, config, rateCrimes) : null;
  const suggesting = recruiting && crimes.length > 0 && (joining === JoinState.Open || warning !== null);

  const elsewhere = suggesting && board ? offPageCrimes(board, crimes) : [];
  const result = rateCrimes([...crimes, ...elsewhere], config);

  // Staff are whoever the site sends every member's level to.
  const members = board && board.members ? board.members : null;
  const prefs = members ? getStaffPrefs() : null;
  const limits = limitsFor(config, prefs);
  const counts = {};

  for (const crime of result.crimes) {
    if (crime.crime.offPage) continue;
    crime.slots.forEach((rated, index) => {
      renderMinimum(rated);
      let flags = [];
      if (members && active && rated.slot.occupied) {
        const member = members[rated.slot.playerId];
        flags = slotFlags(crime.crime, index, rated, member ? member.level : null, limits).filter(
          (flag) => prefs.show[flag.flag],
        );
        for (const flag of flags) counts[flag.flag] = (counts[flag.flag] || 0) + 1;
      }
      renderFlags(rated.slot, flags);
    });
  }

  const suggestions = suggesting ? result.suggestions : [];
  renderSuggestions(root, suggestions);

  const staffPart =
    members && active
      ? staffHtml({ counts, prefs, factionLimits: limitsFor(config), open: staffPanelOpen })
      : "";

  let memberPart = "";
  if (recruiting && crimes.length > 0) {
    let state;
    if (suggestions.length > 0) state = { kind: "best", suggestions, warning };
    else if (joining === JoinState.Blocked) state = { kind: "blocked" };
    else if (joining === JoinState.Full) state = { kind: "full" };
    else state = { kind: "none" };
    memberPart = barHtml(state);
  } else if (staffPart) {
    memberPart = '<span class="nfh-oc-bar-label">OC Assistant</span>';
  }

  if (!memberPart) {
    removeBar();
    return;
  }

  const bar = renderBar(root, memberPart + staffPart);
  if (!bar.dataset.nfhBound) {
    bar.dataset.nfhBound = "1";
    bar.addEventListener("change", (event) => {
      const flag = event.target.getAttribute("data-nfh-oc-flag");
      const limit = event.target.getAttribute("data-nfh-oc-limit");
      if (flag) {
        setStaffPrefs({ show: { ...getStaffPrefs().show, [flag]: event.target.checked } });
      } else if (limit) {
        setStaffPrefs({ [limit]: parseOverride(event.target.value, 1, limit === "levelGap" ? 9 : 168) });
      } else {
        return;
      }
      scheduleRender();
    });
    bar.addEventListener("click", (event) => {
      if (event.target.closest("[data-nfh-oc-staff-toggle]")) {
        staffPanelOpen = !staffPanelOpen;
        scheduleRender();
        return;
      }
      if (!event.target.closest("[data-nfh-oc-show]")) return;
      const best = document.querySelector(`${CRIMES_ROOT_SELECTOR} .nfh-oc-pick--best`);
      if (best) {
        best.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      // The best slot is in a crime Torn has not loaded: go to the end of
      // the list, which is what makes Torn load more.
      const list = document.querySelector(CRIMES_ROOT_SELECTOR);
      if (list) list.scrollIntoView({ behavior: "smooth", block: "end" });
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
