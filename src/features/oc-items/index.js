import { api, ApiError } from "../../core/api.js";
import { escapeHtml } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { setInputValue } from "../../core/torn-editor.js";
import { postTornAction } from "../../core/torn-action.js";
import { openActionBox, readArmoury } from "./armoury.js";
import {
  armouryHash,
  availableCopy,
  currentLoans,
  needersByItem,
  readLoanAnswer,
  stillMissing,
  TAB_LABELS,
  tabInHash,
  tabLabel,
  unusedLoans,
} from "./logic.js";

// Required OC items, on your own faction's crimes and armoury pages
// (`/oc/items` on nuke.family; the faction can switch it off in its OC
// Assistant settings).
//
// - Every member: a line when their own slot is missing the item it needs.
//   They sort it out themselves (some factions don't lend every item).
// - Staff (whoever the site sends `staff` to): every member missing an item,
//   with the armoury tab it's on, and on the armoury page the OC items on loan
//   to someone whose crime doesn't need them. Rows of the open tab are marked
//   Need or Retrieve, Torn's Loan/Give box gets the needing members as one-click
//   fill-ins, and a reusable item with a free copy on the open tab gets a
//   "Loan to <name>" button: one request to Torn, made by that click.
//
// Torn's armoury list from the site can be up to an hour old; the tabs open on
// the page are read from the page and win. The site is asked at most once a
// minute; the page is re-read (debounced) when Torn redraws the armoury.

const PANEL_ID = "nfh-oc-items";
const WANTED_TAB_KEY = "nfhOcItemsTab";
const FILL_CLASS = "nfh-oci-fill";
const BADGE_CLASS = "nfh-oci-badge";
const COLLAPSED_KEY = "nfhOcItemsCollapsed";
const FRESH_MS = 60 * 1000;

const PLACES = {
  crimes: { container: "#faction-crimes-root", insert: (container) => container.parentElement.insertBefore(panelElement(), container) },
  armoury: { container: "#faction-armoury-tabs", insert: (container) => container.parentElement.insertBefore(panelElement(), container) },
};

const state = {
  data: null,
  fetchedAt: 0,
  loading: null,
  error: null,
  message: null,
  busy: new Set(),
  loanedNow: new Set(),
};

let observer = null;
let observed = null;
let redrawTimer = null;

function place() {
  if (!location.search.includes("step=your")) return null;
  if (/tab=crimes/.test(location.hash)) return "crimes";
  if (/tab=armoury/.test(location.hash)) return "armoury";
  return null;
}

function collapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function panelElement() {
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "nfh-cw nfh-oci";
  panel.addEventListener("click", onPanelClick);
  return panel;
}

async function load() {
  if (state.loading) return state.loading;
  if (state.data && Date.now() - state.fetchedAt < FRESH_MS) return state.data;
  state.loading = api("/oc/items")
    .then((answer) => {
      state.data = answer.data || answer;
      state.fetchedAt = Date.now();
      state.error = null;
      return state.data;
    })
    .catch((error) => {
      // 403: not in a Nuke faction; nothing to show.
      state.error = error instanceof ApiError && error.status === 403 ? null : "nuke.family could not be reached for OC items.";
      LogInfo("[oc-items]", error);
      return null;
    })
    .finally(() => {
      state.loading = null;
      redraw();
    });
  return state.loading;
}

// Everything worked out for the page as it is now.
function view() {
  const data = state.data;
  if (!data || !data.enabled) return null;
  const where = place();
  const tab = where === "armoury" ? openArmouryTab() : null;
  const staff = data.staff;
  const live = where === "armoury" ? readArmoury(Object.keys(TAB_LABELS)) : {};
  const missing = staff ? stillMissing(staff.missing, state.loanedNow) : [];
  const mine = (data.mine || []).filter((entry) => !state.loanedNow.has(`${entry.player_id}:${entry.item_id}`));
  const unused = staff && where === "armoury" ? unusedLoans(currentLoans(staff.loans, live), staff.needs, staff.oc_item_ids) : [];
  return { where, tab, staff, live, missing, mine, unused };
}

// A link to an armoury sub-tab. Torn switches sub-tabs with its own tab links
// (jQuery UI tabs), not the URL hash, so on the armoury this clicks Torn's tab
// for the member; from elsewhere it opens the armoury and the tab is shown
// there to click (see wantedTabHint).
function tabLink(tab, label = `${tabLabel(tab)} ›`, className = "nfh-cw-btn") {
  return `<a class="${className}" href="${escapeHtml(armouryHash(tab))}" data-act="go-tab" data-tab="${escapeHtml(tab)}">${escapeHtml(label)}</a>`;
}

// The armoury sub-tab Torn is showing: its active tab, which the URL hash
// doesn't always match (arriving with sub=utilities still shows Deposit).
function openArmouryTab() {
  const active = document.querySelector('#faction-armoury-tabs li.ui-tabs-active[aria-controls^="tab=armoury&sub="]');
  return active ? active.getAttribute("aria-controls").split("sub=")[1] : tabInHash(location.hash);
}

const tornTabAnchor = (tab) => document.querySelector(`#faction-armoury-tabs a.ui-tabs-anchor[href="#tab=armoury&sub=${tab}"]`);

function wantedTab() {
  try {
    return sessionStorage.getItem(WANTED_TAB_KEY);
  } catch (error) {
    return null;
  }
}

function setWantedTab(tab) {
  try {
    if (tab) sessionStorage.setItem(WANTED_TAB_KEY, tab);
    else sessionStorage.removeItem(WANTED_TAB_KEY);
  } catch (error) {
    // the hint is only lost
  }
}

// After arriving from another page: point at Torn's own sub-tab until it's open.
function wantedTabHint(v) {
  const tab = wantedTab();
  document.querySelectorAll(".nfh-oci-tab-hint").forEach((element) => {
    if (element !== tornTabAnchor(tab)) element.classList.remove("nfh-oci-tab-hint");
  });
  if (!tab || v?.where !== "armoury") return "";
  if (v.tab === tab) {
    setWantedTab(null);
    tornTabAnchor(tab)?.classList.remove("nfh-oci-tab-hint");
    return "";
  }
  const anchor = tornTabAnchor(tab);
  if (!anchor) return "";
  anchor.classList.add("nfh-oci-tab-hint");
  return `<div class="nfh-oci-message nfh-oci-message--ok">The ${escapeHtml(tabLabel(tab))} tab is highlighted below. ${tabLink(tab, `Open ${tabLabel(tab)}`)}</div>`;
}

function renderMine(mine, where) {
  return mine
    .map((entry) => {
      const how = entry.reusable ? "It isn't used up, so it can be loaned." : "The crime uses it up.";
      const go =
        where === "armoury" && entry.tab
          ? ""
          : ` ${tabLink(entry.tab, `${tabLabel(entry.tab)} armoury ›`, "")}`;
      return `<div class="nfh-oci-mine"><strong>Your slot needs ${escapeHtml(entry.item_name || `item ${entry.item_id}`)}</strong>, which you don't have
        <span class="nfh-cw-muted">(${escapeHtml(entry.position)} in ${escapeHtml(entry.crime)}). ${how}</span>${go}</div>`;
    })
    .join("");
}

function missingAction(entry, v) {
  const tab = entry.tab;
  if (v.where !== "armoury" || v.tab !== tab) {
    return `${tabLink(tab)}`;
  }
  if (!entry.reusable) return `<span class="nfh-cw-muted">Used up by the crime: give one (row marked Need)</span>`;
  const copy = availableCopy(v.live[tab], entry.item_id);
  if (!copy) return `<span class="nfh-cw-muted">None free in the armoury</span>`;
  const key = `${entry.player_id}:${entry.item_id}`;
  const name = entry.player_name || `#${entry.player_id}`;
  return `<button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-act="loan" data-key="${escapeHtml(key)}"${state.busy.has(key) ? " disabled" : ""}
    title="Sends Torn one loan request now, as if you used the Loan box">${state.busy.has(key) ? "Loaning…" : `Loan to ${escapeHtml(name)}`}</button>`;
}

function renderStaff(v) {
  const parts = [];
  parts.push(`<div class="nfh-oci-heading">Missing items${v.missing.length ? ` (${v.missing.length})` : ""}</div>`);
  if (!v.missing.length) parts.push(`<div class="nfh-cw-muted">Everyone in a crime has their item.</div>`);
  for (const entry of v.missing) {
    parts.push(`<div class="nfh-oci-row">
      <span class="nfh-oci-who"><a href="/profiles.php?XID=${entry.player_id}">${escapeHtml(entry.player_name || `#${entry.player_id}`)}</a></span>
      <span class="nfh-oci-what"><strong>${escapeHtml(entry.item_name || `Item ${entry.item_id}`)}</strong>
        <span class="nfh-cw-muted">${escapeHtml(entry.position)} · ${escapeHtml(entry.crime)}</span></span>
      <span class="nfh-cw-actions">${missingAction(entry, v)}</span></div>`);
  }

  if (v.where === "armoury") {
    parts.push(`<div class="nfh-oci-heading">Loaned, not needed${v.unused.length ? ` (${v.unused.length})` : ""}</div>`);
    if (!v.unused.length) parts.push(`<div class="nfh-cw-muted">No OC items are out with members who don't need them.</div>`);
    for (const loan of v.unused) {
      const action =
        v.tab === loan.tab
          ? `<span class="nfh-cw-muted">Retrieve it on the marked row</span>`
          : `${tabLink(loan.tab)}`;
      parts.push(`<div class="nfh-oci-row">
        <span class="nfh-oci-who"><a href="/profiles.php?XID=${loan.player_id}">${escapeHtml(loan.player_name || `#${loan.player_id}`)}</a></span>
        <span class="nfh-oci-what"><strong>${escapeHtml(loan.item_name)}</strong> <span class="nfh-cw-muted">${escapeHtml(loan.reason)}</span></span>
        <span class="nfh-cw-actions">${action}</span></div>`);
    }
    const staff = v.staff;
    const when = staff.loans_at ? new Date(staff.loans_at * 1000).toISOString().slice(11, 16) : null;
    parts.push(
      `<div class="nfh-cw-muted nfh-oci-foot">${
        staff.loans_error
          ? escapeHtml(staff.loans_error) + " Open each armoury tab to check it here."
          : `Loans from Torn's armoury list${when ? ` at ${when} TCT` : ""} (Torn updates it up to hourly). Tabs you open here are read live.`
      }</div>`,
    );
  }
  return parts.join("");
}

function render(v) {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const show = v && (v.mine.length || v.staff);
  panel.hidden = !show && !state.error;
  if (!show) {
    panel.innerHTML = state.error ? `<div class="nfh-cw-bar"><span class="nfh-cw-error">${escapeHtml(state.error)}</span></div>` : "";
    return;
  }
  const counts = [];
  if (v.mine.length) counts.push("your slot needs an item");
  if (v.staff) counts.push(`${v.missing.length} missing`);
  if (v.staff && v.where === "armoury") counts.push(`${v.unused.length} to retrieve`);
  const attention = v.mine.length || v.missing.length || v.unused.length;
  panel.classList.toggle("nfh-cw--attn", !!attention);
  const isCollapsed = collapsed();
  const message = state.message ? `<div class="nfh-oci-message nfh-oci-message--${state.message.tone}" role="status">${escapeHtml(state.message.text)}</div>` : "";
  const hint = wantedTabHint(v);
  const html = `<div class="nfh-cw-bar">
      <button type="button" class="nfh-cw-toggle" data-act="toggle" aria-expanded="${!isCollapsed}"><span class="nfh-cw-caret">${isCollapsed ? "▸" : "▾"}</span> OC items</button>
      <span class="nfh-cw-status">${escapeHtml(counts.join(" · "))}</span>
    </div>${isCollapsed ? "" : `<div class="nfh-oci-body">${hint}${message}${renderMine(v.mine, v.where)}${v.staff ? renderStaff(v) : ""}</div>`}`;
  if (panel.innerHTML !== html) panel.innerHTML = html;
}

// Marks on the open tab's rows, and fill-ins in an open Loan/Give box.
function decorate(v) {
  if (!v || !v.staff || v.where !== "armoury" || !v.tab) return;
  const rows = v.live[v.tab] || [];
  const needers = needersByItem(v.missing.filter((entry) => entry.tab === v.tab));
  const retrieve = new Map(v.unused.filter((loan) => loan.tab === v.tab).map((loan) => [`${loan.player_id}:${loan.item_id}`, loan]));

  for (const row of rows) {
    let badge = null;
    if (!row.loanedTo && needers.has(row.itemId)) {
      const who = needers.get(row.itemId);
      badge = { kind: "need", text: `Need ×${who.length}`, title: `Needed by ${who.map((entry) => `${entry.player_name || entry.player_id} (${entry.position}, ${entry.crime})`).join(", ")}` };
    } else if (row.loanedTo && retrieve.has(`${row.loanedTo}:${row.itemId}`)) {
      const loan = retrieve.get(`${row.loanedTo}:${row.itemId}`);
      badge = { kind: "retrieve", text: "Retrieve", title: `${loan.player_name || loan.player_id}: ${loan.reason}` };
    }
    setBadge(row.li, badge);
  }

  const box = openActionBox(v.tab);
  document.querySelectorAll(`.${FILL_CLASS}`).forEach((fill) => {
    if (!box || !box.box.contains(fill)) fill.remove();
  });
  if (box && needers.has(box.itemId)) {
    const who = needers.get(box.itemId);
    const html = `<span class="nfh-cw-muted">Fill in:</span> ${who
      .map((entry) => `<button type="button" class="nfh-cw-chip" data-fill="${escapeHtml(`${entry.player_name} [${entry.player_id}]`)}">${escapeHtml(entry.player_name || entry.player_id)}</button>`)
      .join(" ")}`;
    let fill = box.box.querySelector(`.${FILL_CLASS}`);
    if (!fill) {
      fill = document.createElement("div");
      fill.className = `nfh-cw ${FILL_CLASS}`;
      fill.addEventListener("click", (event) => {
        const chip = event.target.closest("[data-fill]");
        if (!chip) return;
        event.preventDefault();
        setInputValue(box.input, chip.dataset.fill);
        box.input.focus();
      });
      box.box.appendChild(fill);
    }
    if (fill.innerHTML !== html) fill.innerHTML = html;
  }
}

function setBadge(li, badge) {
  const name = li.querySelector(".name") || li;
  const existing = name.querySelector(`.${BADGE_CLASS}`);
  li.classList.toggle("nfh-oci-row--need", badge?.kind === "need");
  li.classList.toggle("nfh-oci-row--retrieve", badge?.kind === "retrieve");
  if (!badge) {
    existing?.remove();
    return;
  }
  if (existing && existing.textContent === badge.text && existing.title === badge.title) return;
  const element = existing || document.createElement("span");
  element.className = `${BADGE_CLASS} ${BADGE_CLASS}--${badge.kind}`;
  element.textContent = badge.text;
  element.title = badge.title;
  if (!existing) name.prepend(element);
}

function redraw() {
  const v = view();
  render(v);
  decorate(v);
}

function scheduleRedraw() {
  clearTimeout(redrawTimer);
  redrawTimer = setTimeout(redraw, 250);
}

const ourNode = (node) =>
  node.nodeType !== 1 || node.id === PANEL_ID || node.classList.contains(BADGE_CLASS) || node.classList.contains(FILL_CLASS) || !!node.closest?.(`#${PANEL_ID}`);

function isOurs(record) {
  if (record.type === "attributes") {
    const before = new Set(String(record.oldValue || "").split(/\s+/).filter((name) => name && !name.startsWith("nfh-")));
    const after = new Set([...record.target.classList].filter((name) => !name.startsWith("nfh-")));
    return before.size === after.size && [...before].every((name) => after.has(name));
  }
  if (ourNode(record.target)) return true;
  return [...record.addedNodes, ...record.removedNodes].every(ourNode);
}

function watch(container) {
  if (observed === container) return;
  observer?.disconnect();
  observed = container;
  observer = new MutationObserver((records) => {
    // Our own badges, fill-ins and row marks don't count; Torn redrawing a
    // tab or opening a Loan box (a class on the row) does.
    if (!records.every(isOurs)) scheduleRedraw();
  });
  observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
}

async function loan(key) {
  const v = view();
  const entry = v?.missing.find((candidate) => `${candidate.player_id}:${candidate.item_id}` === key);
  if (!entry || state.busy.has(key)) return;
  const copy = availableCopy(v.live[entry.tab], entry.item_id);
  if (!copy) return;
  state.busy.add(key);
  state.message = null;
  redraw();
  try {
    const answer = await postTornAction("factions.php", {
      ajax: "true",
      step: "armouryActionItem",
      role: "loan",
      item: copy.armoryId,
      itemID: String(entry.item_id),
      type: copy.type,
      user: `${entry.player_name} [${entry.player_id}]`,
      quantity: "1",
    });
    const result = readLoanAnswer(answer.text);
    if (answer.ok && result.ok) {
      state.loanedNow.add(key);
      state.message = { tone: "ok", text: result.message || `Loaned ${entry.item_name} to ${entry.player_name}. The armoury list updates when Torn redraws it.` };
    } else {
      state.message = { tone: "error", text: `Torn did not loan it${result.message ? `: ${result.message}` : ` (status ${answer.status})`}. Use the Loan box on the row instead.` };
    }
  } catch (error) {
    state.message = { tone: "error", text: error.message };
  } finally {
    state.busy.delete(key);
    redraw();
  }
}

function onPanelClick(event) {
  const target = event.target.closest("[data-act]");
  if (!target || target.disabled) return;
  if (target.dataset.act === "toggle") {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed() ? "0" : "1");
    } catch (error) {
      // stays as it is
    }
    redraw();
  } else if (target.dataset.act === "loan") {
    loan(target.dataset.key);
  } else if (target.dataset.act === "go-tab") {
    const tab = target.dataset.tab;
    const anchor = tornTabAnchor(tab);
    if (anchor) {
      // On the armoury: Torn's own tab, clicked for the member's click.
      event.preventDefault();
      setWantedTab(null);
      anchor.click();
    } else {
      // Elsewhere the link opens the armoury; its tab is pointed out there.
      setWantedTab(tab);
    }
  }
}

export default {
  name: "OC items",
  pages: [PageType.FactionCrimes, PageType.FactionArmoury],
  init() {
    const where = place();
    if (!where) {
      document.getElementById(PANEL_ID)?.remove();
      observer?.disconnect();
      observed = null;
      return;
    }
    const settle = (container) => {
      if (!document.getElementById(PANEL_ID)) PLACES[where].insert(container);
      watch(where === "armoury" ? document.getElementById("faction-armoury") || container : container.parentElement || container);
      redraw();
      load();
    };
    const container = document.querySelector(PLACES[where].container);
    if (container) settle(container);
    // Torn draws the tab after the hash changes; try again a few times.
    let tries = 10;
    const again = () => {
      const now = document.querySelector(PLACES[where].container);
      if (now && (!document.getElementById(PANEL_ID) || document.getElementById(PANEL_ID).nextElementSibling !== now)) {
        document.getElementById(PANEL_ID)?.remove();
        settle(now);
      }
      if (--tries > 0 && place() === where) setTimeout(again, 400);
    };
    setTimeout(again, 400);
  },
};
