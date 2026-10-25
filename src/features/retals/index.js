import { ApiError } from "../../core/api.js";
import { getApiToken } from "../../core/auth.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { isPda } from "../../core/pda-polyfill.js";
import { isOwnFactionMainTab } from "../../core/torn-page.js";
import { startCapture } from "./capture.js";
import { claimRetal, fetchRetals, markSent, report, sentIds, unclaimRetal } from "./data.js";
import { attacksToReport, feedFactionId, retalState } from "./logic.js";
import { attackUrl, renderList } from "./view.js";

// Retal alerts: hears Torn's chain feed on the member's own faction page,
// tells nuke.family about enemies who hit our members (and about our hits
// Torn counted as retals), and lists who can still be hit back under Torn's
// recent attacks, with a countdown, a claim and an attack button.
//
// Kept cheap, like chain watch: one 1s timer that only exists while the
// recent attacks list is open, polling only while the tab is visible and no
// report has brought the list in the last few seconds, and the list rewritten
// only when its HTML changed.

const ROOT_ID = "nfh-retals";
const ANCHOR_SELECTOR = ".chain-attacks-list.recent-attacks";
const POLL_MS = 10 * 1000;
const ERROR_MS = 6000;

const state = {
  retals: [],
  offset: 0, // server clock minus ours, in seconds
  lastAnswerAt: 0,
  polling: false,
  refused: false, // not in a Nuke faction, or a site without retals: stop asking
  ui: { busy: null, warn: null, error: null },
  errorUntil: 0,
};

const sourcesSeen = new Set();
let sending = false;
let queued = false;
let latestFeed = null;
let root = null;
let rendered = null;
let ticker = null;

const serverNow = () => Math.floor(Date.now() / 1000) + state.offset;

// An answer from any of the retal routes: { server_now, retals }.
function take(answer) {
  if (!answer || !Array.isArray(answer.retals)) return;
  state.retals = answer.retals;
  if (answer.server_now) state.offset = answer.server_now - Math.floor(Date.now() / 1000);
  state.lastAnswerAt = Date.now();
  render();
}

// Not a Nuke faction member (403), or a site that has no retals yet (a 404
// that is not the list's own "no longer open"): stop for this page.
function isRefusal(error) {
  return error instanceof ApiError && (error.status === 403 || (error.status === 404 && !(error.body && error.body.retals)));
}

function showError(text) {
  state.ui.error = text;
  state.errorUntil = Date.now() + ERROR_MS;
  render();
}

function stop() {
  state.refused = true;
  if (ticker) clearInterval(ticker);
  ticker = null;
  if (root) root.remove();
  root = null;
  rendered = null;
}

// --- Reporting what Torn's chain feed shows ---------------------------------

function onFeed(feed, source, keys) {
  if (!isOwnFactionMainTab() || state.refused) return;

  if (!sourcesSeen.has(source)) {
    sourcesSeen.add(source);
    LogInfo(`[retals] first chain feed from ${source}`, { answer_keys: keys, sample: feed.recentAttacks[0] });
  }

  const stealthed = feed.recentAttacks.find((attack) => Number(attack.stealthAttack) !== 0);
  if (stealthed && !sourcesSeen.has("stealth")) {
    sourcesSeen.add("stealth");
    LogInfo("[retals] a stealthed attack as Torn gives it", stealthed, feed.users[stealthed.attackerID] || null);
  }

  latestFeed = feed;
  flush();
  mount();
}

async function flush() {
  if (sending) {
    queued = true;
    return;
  }
  const feed = latestFeed;
  if (!feed || !getApiToken()) return;

  const factionId = feedFactionId(feed);
  if (!factionId) {
    LogInfo("[retals] could not tell the faction from the feed", feed);
    return;
  }

  const attacks = attacksToReport(feed, factionId, sentIds(), Math.floor(Date.now() / 1000));

  // Attacks that don't matter never will, so they are dealt with now; the
  // ones being reported only once the site has them.
  const reporting = new Set(attacks.map((attack) => attack.id));
  markSent(feed.recentAttacks.filter((attack) => attack.publicID && !reporting.has(String(attack.publicID))));

  if (!attacks.length) return;

  LogInfo(`[retals] reporting for faction ${factionId}`, attacks);
  sending = true;
  try {
    take(await report(factionId, attacks));
    markSent(attacks);
  } catch (error) {
    if (isRefusal(error)) stop();
    // Otherwise left unsent, so the next feed update tries them again.
    LogInfo("[retals] report failed", error.status ?? error.kind, error.body ?? error.message);
  } finally {
    sending = false;
    if (queued) {
      queued = false;
      flush();
    }
  }
}

// --- The list ----------------------------------------------------------------

function render() {
  if (!root) return;
  if (state.ui.error && Date.now() > state.errorUntil) state.ui.error = null;
  const html = renderList(state.retals, serverNow(), state.ui);
  if (html === rendered) return;
  rendered = html;
  root.innerHTML = html;
  root.hidden = html === "";
}

// Put the list under Torn's recent attacks, or back there after React
// re-rendered the chain box. Gone with the list when the box is closed.
function mount() {
  if (state.refused || !getApiToken() || !isOwnFactionMainTab()) return false;
  const anchor = document.querySelector(ANCHOR_SELECTOR);
  if (!anchor) {
    if (root) root.remove();
    root = null;
    rendered = null;
    return false;
  }
  if (!root || !root.isConnected || root.previousElementSibling !== anchor) {
    if (root) root.remove();
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "nfh-cw nfh-rt";
    root.hidden = true;
    root.addEventListener("click", onClick);
    anchor.insertAdjacentElement("afterend", root);
    rendered = null;
  }
  if (!ticker) ticker = setInterval(tick, 1000);
  render();
  return true;
}

function tick() {
  if (!mount()) {
    clearInterval(ticker);
    ticker = null;
    return;
  }
  if (!document.hidden && !state.polling && Date.now() - state.lastAnswerAt >= POLL_MS) poll();
}

async function poll() {
  state.polling = true;
  try {
    take(await fetchRetals());
  } catch (error) {
    if (isRefusal(error)) stop();
    // Anything else: the next tick tries again after the poll interval.
    state.lastAnswerAt = Date.now();
  } finally {
    state.polling = false;
  }
}

function find(enemyId) {
  return state.retals.find((retal) => retal.enemy_id === enemyId);
}

// Claim or let go. Every answer, refusals included, carries the fresh list.
async function changeClaim(enemyId, change) {
  state.ui.busy = enemyId;
  render();
  try {
    take(await change(enemyId));
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && error.body && error.body.retals) take(error.body);
    if (error instanceof ApiError && error.status === 409) return { ok: false, takenBy: error.body.claimed_by };
    if (error instanceof ApiError && error.status === 404) return { ok: false, gone: true };
    if (isRefusal(error)) stop();
    return { ok: false, failed: true };
  } finally {
    state.ui.busy = null;
    render();
  }
}

// Open the attack page: in a new tab in a browser (the list stays open
// here), in the same view in TornPDA, which has no tabs.
function openAttack(enemyId, tab = null) {
  const url = attackUrl(enemyId);
  if (isPda) {
    window.location.href = url;
    return;
  }
  if (tab) tab.location.href = url;
  else if (!window.open(url, "_blank")) window.location.href = url;
}

function openBlankTab() {
  if (isPda) return null;
  try {
    return window.open("", "_blank");
  } catch (e) {
    return null;
  }
}

// Attack claims first. Someone else's live claim (as the list shows it, or as
// the claim's answer says) gets a warning with "Attack anyway" instead.
async function attack(enemyId) {
  const retal = find(enemyId);
  const now = serverNow();
  const current = retal ? retalState(retal, now) : "free";

  if (current === "taken") {
    state.ui.warn = { enemyId, name: retal.claimed_by.name };
    render();
    return;
  }
  if (current === "mine" || current === "done") {
    openAttack(enemyId);
    if (current === "mine") changeClaim(enemyId, claimRetal);
    return;
  }

  // Opened inside the click, or a popup blocker refuses it.
  const tab = openBlankTab();
  const result = await changeClaim(enemyId, claimRetal);
  if (result.takenBy) {
    if (tab) tab.close();
    state.ui.warn = { enemyId, name: result.takenBy.name };
    render();
    return;
  }
  if (result.failed) showError("Could not claim it on nuke.family; attacking anyway.");
  openAttack(enemyId, tab);
}

function onClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target || !root.contains(target)) return;
  const enemyId = Number(target.dataset.enemy);
  const action = target.dataset.action;

  // Let a middle or modified click on a link do what the browser does.
  if (target.tagName === "A" && (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey)) return;
  event.preventDefault();

  if (action === "claim") {
    changeClaim(enemyId, claimRetal).then((result) => {
      if (result.takenBy) {
        state.ui.warn = { enemyId, name: result.takenBy.name };
        render();
      } else if (result.failed) showError("Could not reach nuke.family to claim it.");
    });
  } else if (action === "unclaim") {
    changeClaim(enemyId, unclaimRetal).then((result) => {
      if (result.failed) showError("Could not reach nuke.family to unclaim it.");
    });
  } else if (action === "attack") {
    attack(enemyId);
  } else if (action === "attack-anyway") {
    state.ui.warn = null;
    render();
    openAttack(enemyId);
  } else if (action === "dismiss") {
    state.ui.warn = null;
    render();
  }
}

export default {
  name: "retals",
  pages: [PageType.Faction],
  init() {
    if (!isOwnFactionMainTab() || state.refused) return;
    // Listening is once per page load: it keeps working across tab switches
    // and ignores the feed off the main tab. The list is mounted whenever the
    // recent attacks list is there (the feed arriving means it is).
    startCapture(onFeed);
    mount();
  },
};
