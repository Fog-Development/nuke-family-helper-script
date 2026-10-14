import { api, ApiError, publicApi } from "../core/api.js";
import { Connection, connectionState, onConnectionChange, setApiToken } from "../core/auth.js";
import { escapeHtml } from "../core/dom.js";
import { onNavigate } from "../core/pages.js";
import { isPda } from "../core/pda-polyfill.js";
import { getValue, setValue } from "../core/storage.js";
import { getUserscriptUsersPlayerId } from "../core/torn-page.js";

// Connecting the script to the member's nuke.family account, and saying so,
// loudly enough to notice, whenever it is not connected.
//
// No key is typed or copied. The script asks nuke.family for a connection and
// is handed a secret and a page; the member approves on that page (logged in,
// or with just their Torn API key, which the site takes, never the script);
// the script, still here on Torn, keeps asking with its secret until the site
// hands over its token. Nothing has to cross from nuke.family to Torn through
// the browser, which is what made the old way (reading the key off
// nuke.family's token page) unreliable, and impossible in TornPDA.
//
// Typing a key in by hand is still there as a fallback, checked with the site
// before it is kept.

const BANNER_ID = "nfh-connect-banner";
const NOTE_CLASS = "nfh-connect-note";
const PENDING_KEY = "nfhConnectPending";
const HIDDEN_KEY = "nfhConnectBannerHidden";
const HIDE_FOR_MS = 24 * 60 * 60 * 1000;
const POLL_MS = 4000;
const RELOAD_AFTER_MS = 1500;

// Where a feature would have shown something: each gets a one-line note
// while the script is not connected. Found by selector so no feature has to
// know about this; a host that is not on the page is simply skipped.
const NOTE_HOSTS = [
  { selector: "#faction-crimes-root", place: "beforebegin" },
  { selector: "#nfh-chain-watch", place: "afterend" },
  { selector: "#nfh-war-bar", place: "afterend" },
  { selector: ".nfh-shitlist-profile", place: "beforeend" },
];

// What the banner is doing beyond reflecting the connection state:
//   null                          nothing
//   { kind: "starting" }          asking nuke.family for a connection
//   { kind: "waiting", url }      the member is approving on nuke.family
//   { kind: "connected", name }   just connected; the page is about to reload
//   { kind: "failed", message }   the last attempt did not work
let phase = null;
let pollTimer = null;

const STATE_TEXT = {
  [Connection.Missing]: "<strong>Nuke Family Helper is not connected</strong> to nuke.family, so most of it is switched off.",
  [Connection.Rejected]:
    "<strong>Nuke Family Helper has been disconnected:</strong> nuke.family no longer accepts this device's key, so most of it is switched off.",
  [Connection.Unreachable]:
    "<strong>Nuke Family Helper cannot reach nuke.family</strong> right now, so what it shows may be missing or out of date.",
};

const NOTE_TEXT = {
  [Connection.Missing]: "Nuke Family Helper is not connected to nuke.family, so this may be missing or out of date.",
  [Connection.Rejected]: "Nuke Family Helper has been disconnected from nuke.family, so this may be missing or out of date.",
  [Connection.Unreachable]: "Nuke Family Helper cannot reach nuke.family right now: this may be missing or out of date.",
};

const canConnect = (state) => state === Connection.Missing || state === Connection.Rejected;

function pending() {
  const saved = getValue(PENDING_KEY, null);
  if (!saved || typeof saved !== "object" || !saved.secret || !saved.url) return null;
  return saved.expires > Date.now() ? saved : null;
}

function isHidden(state) {
  try {
    const hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "null");
    return Boolean(hidden) && hidden.state === state && Date.now() - hidden.at < HIDE_FOR_MS;
  } catch (e) {
    return false;
  }
}

function bannerHtml(state) {
  const button = (attribute, label) => `<button type="button" class="torn-btn" ${attribute}>${label}</button>`;
  const dismiss = '<button type="button" class="nfh-connect-dismiss" data-nfh-connect-dismiss aria-label="Hide" title="Hide for a day">&times;</button>';

  if (phase && phase.kind === "connected") {
    const who = phase.name ? ` as <strong>${escapeHtml(phase.name)}</strong>` : "";
    return `<span class="nfh-connect-text">Nuke Family Helper is connected${who}. Reloading the page...</span>`;
  }
  if (phase && phase.kind === "starting") {
    return '<span class="nfh-connect-text">Asking nuke.family for a connection...</span>';
  }
  if (phase && phase.kind === "waiting") {
    return (
      '<span class="nfh-connect-text"><strong>Finish connecting on nuke.family.</strong> ' +
      "Approve there, then come back: this page picks it up by itself.</span>" +
      `<a class="torn-btn nfh-connect-link" href="${escapeHtml(phase.url)}" target="_blank" rel="noopener" data-nfh-connect-open>Open nuke.family</a>` +
      button("data-nfh-connect-cancel", "Cancel")
    );
  }

  const failed = phase && phase.kind === "failed" ? ` <span class="nfh-connect-error">${escapeHtml(phase.message)}</span>` : "";
  const actions = canConnect(state)
    ? button("data-nfh-connect", state === Connection.Rejected ? "Reconnect" : "Connect") +
      '<button type="button" class="nfh-connect-manual" data-nfh-connect-manual>Enter a key instead</button>'
    : "";
  return `<span class="nfh-connect-text">${STATE_TEXT[state]}${failed}</span>${actions}${dismiss}`;
}

function renderBanner() {
  const state = connectionState();
  const busy = phase !== null && phase.kind !== "failed";
  const show = busy || (state !== Connection.Connected && !isHidden(state));
  let banner = document.getElementById(BANNER_ID);

  if (!show) {
    if (banner) banner.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.className = "nfh-connect-banner";
    banner.setAttribute("role", "status");
    document.body.prepend(banner);
  }
  const html = bannerHtml(state);
  if (banner.__nfhHtml !== html) {
    banner.innerHTML = html;
    banner.__nfhHtml = html;
  }
  banner.classList.toggle("nfh-connect-banner--ok", Boolean(phase && phase.kind === "connected"));
}

function renderNotes() {
  const state = connectionState();
  const text = NOTE_TEXT[state];

  for (const host of NOTE_HOSTS) {
    const element = document.querySelector(host.selector);
    if (!element) continue;
    const sibling = host.place === "beforebegin" ? element.previousElementSibling : host.place === "afterend" ? element.nextElementSibling : null;
    let note = host.place === "beforeend" ? element.querySelector(`:scope > .${NOTE_CLASS}`) : sibling && sibling.classList.contains(NOTE_CLASS) ? sibling : null;

    if (!text) {
      if (note) note.remove();
      continue;
    }
    if (!note) {
      note = document.createElement("div");
      note.className = NOTE_CLASS;
      element.insertAdjacentElement(host.place, note);
    }
    const html =
      `<span>${text}</span>` +
      (canConnect(state) ? ' <button type="button" class="nfh-connect-note-link" data-nfh-connect>Connect</button>' : "");
    if (note.__nfhHtml !== html) {
      note.innerHTML = html;
      note.__nfhHtml = html;
    }
  }
}

function render() {
  renderBanner();
  renderNotes();
}

// Feature areas appear a moment after the page (and after navigation), so the
// notes are looked for again a few times rather than observed for ever.
function renderSoon() {
  render();
  for (const delay of [800, 2500, 6000]) setTimeout(renderNotes, delay);
}

function stopPolling() {
  clearTimeout(pollTimer);
  pollTimer = null;
}

function fail(message) {
  stopPolling();
  setValue(PENDING_KEY, null);
  phase = { kind: "failed", message };
  render();
}

function schedulePoll() {
  stopPolling();
  if (!document.hidden) pollTimer = setTimeout(poll, POLL_MS);
}

let polling = false;
async function poll() {
  const waiting = pending();
  if (!waiting) {
    if (phase && phase.kind === "waiting") fail("That attempt ran out of time. Press Connect to try again.");
    return;
  }
  if (polling) return;
  polling = true;

  try {
    const reply = await publicApi("/script/connect/token", { method: "POST", data: { secret: waiting.secret } });
    if (reply && reply.status === "connected" && reply.token) {
      stopPolling();
      setValue(PENDING_KEY, null);
      phase = { kind: "connected", name: reply.player && reply.player.name };
      setApiToken(reply.token);
      render();
      // Everything the script shows was built without a key: start over.
      setTimeout(() => window.location.reload(), RELOAD_AFTER_MS);
      return;
    }
    schedulePoll();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
      fail((error.body && error.body.error) || "That attempt can no longer be used. Press Connect to try again.");
    } else {
      // No answer, or the site is busy: keep waiting, it may come back.
      schedulePoll();
    }
  } finally {
    polling = false;
  }
}

function wait(connection) {
  phase = { kind: "waiting", url: connection.url };
  render();
  schedulePoll();
}

async function startConnect() {
  if (phase && (phase.kind === "starting" || phase.kind === "connected")) return;

  // Opened now, inside the click, or a popup blocker refuses it; pointed at
  // nuke.family once the address is known. TornPDA has no such tabs: there
  // the banner's own link is tapped instead.
  let tab = null;
  if (!isPda) {
    try {
      tab = window.open("", "_blank");
    } catch (e) {
      tab = null;
    }
  }

  phase = { kind: "starting" };
  render();

  try {
    const playerId = Number(getUserscriptUsersPlayerId()) || null;
    const reply = await publicApi("/script/connect", {
      method: "POST",
      data: { client: isPda ? "TornPDA" : "browser", player_id: playerId },
    });
    if (!reply || !reply.secret || !reply.url) throw new Error("unexpected reply");

    const connection = { secret: reply.secret, url: reply.url, expires: Date.now() + (reply.expires_in || 900) * 1000 };
    setValue(PENDING_KEY, connection);
    if (tab) tab.location.href = connection.url;
    wait(connection);
  } catch (error) {
    if (tab) tab.close();
    const busy = error instanceof ApiError && error.status === 429;
    fail(
      busy
        ? "Too many attempts from here. Wait a few minutes and try again."
        : "Could not reach nuke.family to start. Check your connection and try again.",
    );
  }
}

// Type a nuke.family key in by hand: the fallback for when connecting the
// usual way does not work somewhere. Resolves true when a key was saved.
export async function enterKeyByHand() {
  const typed = prompt(
    "Paste your Nuke Family key (about 50 characters, made on nuke.family under your user settings).\n\n" +
      "This is NOT your Torn API key.",
  );
  const key = (typed || "").trim();
  if (!key) return false;

  if (/^[A-Za-z0-9]{16}$/.test(key)) {
    alert(
      "That looks like a Torn API key. The script needs a Nuke Family key here, which is much longer.\n\n" +
        "The easy way: press Connect instead. nuke.family will ask for your Torn key there and connect the script for you.",
    );
    return false;
  }

  try {
    await api("/user/get-own-roles", { token: key, feature: "connect" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      alert("nuke.family did not accept that key, so it was not saved. Check you copied all of it, or press Connect instead.");
      return false;
    }
    alert("nuke.family could not be reached to check that key. It has been saved; if things still do not load, press Connect instead.");
    setApiToken(key);
    return true;
  }

  setApiToken(key);
  alert("Nuke Family key saved. Reload the page to load everything with it.");
  return true;
}

function onClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest("[data-nfh-connect]")) {
    event.preventDefault();
    startConnect();
  } else if (target.closest("[data-nfh-connect-manual]")) {
    enterKeyByHand().then((saved) => {
      if (saved) window.location.reload();
    });
  } else if (target.closest("[data-nfh-connect-cancel]")) {
    stopPolling();
    setValue(PENDING_KEY, null);
    phase = null;
    render();
  } else if (target.closest("[data-nfh-connect-open]")) {
    // Back from nuke.family in the same view (TornPDA): ask at once.
    setTimeout(poll, 1000);
  } else if (target.closest("[data-nfh-connect-dismiss]")) {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify({ state: connectionState(), at: Date.now() }));
    } catch (e) {
      // Hidden for this page only, then.
    }
    phase = null;
    render();
  }
}

let started = false;
export function initConnect() {
  if (started || window.top !== window.self) return;
  started = true;

  document.addEventListener("click", onClick);
  onConnectionChange(render);
  onNavigate(renderSoon);
  // Coming back from approving on nuke.family: do not wait for the next tick.
  const resume = () => {
    if (!document.hidden && pending() && connectionState() !== Connection.Connected) poll();
  };
  document.addEventListener("visibilitychange", resume);
  window.addEventListener("focus", resume);

  // A connection begun on an earlier page load (TornPDA opens nuke.family in
  // the same view, so the member comes back to a fresh page).
  const waiting = canConnect(connectionState()) ? pending() : null;
  if (waiting) {
    wait(waiting);
    poll();
  }
  renderSoon();
}
