import { escapeHtml } from "../../core/dom.js";
import { formatLeft, retalState, visibleRetals } from "./logic.js";
import { MAX_MIN_SECONDS } from "./prefs.js";

// Pure HTML for the retal section under Torn's recent attacks: a one-line
// header (always there, so the settings can be reached), the settings, and
// the list. Every name comes from Torn by way of nuke.family, so all of it
// goes through escapeHtml.

export function profileUrl(playerId) {
  return `/profiles.php?XID=${encodeURIComponent(playerId)}`;
}

export function attackUrl(playerId) {
  return `/page.php?sid=attack&user2ID=${encodeURIComponent(playerId)}`;
}

// The name sits in a wrapper the stat tags are put on afterwards (stats.js).
function enemyName(retal) {
  const name = escapeHtml(retal.enemy_name || `#${retal.enemy_id}`);
  const tag = retal.enemy_faction_tag ? ` <span class="nfh-rt-tag">${escapeHtml(retal.enemy_faction_tag)}</span>` : "";
  return `<span class="nfh-rt-who" data-nfh-tag="${escapeHtml(retal.enemy_id)}"><a class="nfh-rt-name" href="${profileUrl(retal.enemy_id)}">${name}</a></span>${tag}`;
}

function victims(retal) {
  const list = retal.victims || [];
  if (!list.length) return "";
  const first = escapeHtml(list[0].name || `#${list[0].id}`);
  const more = list.length > 1 ? ` +${list.length - 1}` : "";
  return `<span class="nfh-rt-muted">hit ${first}${more}</span>`;
}

function buttons(retal, state, ui) {
  const busy = ui.busy === retal.enemy_id ? " disabled" : "";
  const id = escapeHtml(retal.enemy_id);
  const claim =
    state === "mine"
      ? `<button type="button" class="nfh-cw-btn" data-action="unclaim" data-enemy="${id}"${busy}>Unclaim</button>`
      : state === "free"
        ? `<button type="button" class="nfh-cw-btn" data-action="claim" data-enemy="${id}"${busy}>Claim</button>`
        : "";
  const attack = `<a class="nfh-cw-btn nfh-cw-btn--primary nfh-rt-attack" href="${attackUrl(retal.enemy_id)}" data-action="attack" data-enemy="${id}">Attack</a>`;
  return `<span class="nfh-rt-actions">${claim}${attack}</span>`;
}

function row(retal, now, ui) {
  const state = retalState(retal, now);
  const id = escapeHtml(retal.enemy_id);

  if (state === "done") {
    const by = retal.done_by && retal.done_by.name ? ` by ${escapeHtml(retal.done_by.name)}` : "";
    return `<li class="nfh-rt-row is-done" data-enemy="${id}"><span class="nfh-rt-main">${enemyName(retal)} <span class="nfh-rt-muted">retal done${by}</span></span></li>`;
  }

  const left = retal.expires_at - now;
  const hold =
    state === "mine"
      ? `<span class="nfh-rt-held is-mine">Claimed by you</span>`
      : state === "taken"
        ? `<span class="nfh-rt-held">Claimed by ${escapeHtml(retal.claimed_by.name || "someone")}</span>`
        : "";
  const warning =
    ui.warn && ui.warn.enemyId === retal.enemy_id
      ? `<div class="nfh-rt-warn" role="alert">${escapeHtml(ui.warn.name || "Someone")} has claimed this retal.
          <a class="nfh-cw-btn" href="${attackUrl(retal.enemy_id)}" data-action="attack-anyway" data-enemy="${id}">Attack anyway</a>
          <button type="button" class="nfh-cw-btn" data-action="dismiss" data-enemy="${id}">Cancel</button></div>`
      : "";

  return `<li class="nfh-rt-row is-${state}${left <= 60 ? " is-ending" : ""}" data-enemy="${id}">
    <span class="nfh-rt-main">${enemyName(retal)} ${victims(retal)}</span>
    <span class="nfh-rt-left" title="Time left to retaliate">${formatLeft(left)}</span>
    ${hold}
    ${buttons(retal, state, ui)}
    ${warning}
  </li>`;
}

// "Retals  2 open  [Settings]". `show` false: "off".
export function renderHead(retals, now, prefs, ui = {}) {
  const open = prefs.show ? visibleRetals(retals, now).filter((retal) => !retal.done_at).length : 0;
  const summary = !prefs.show ? "off" : open ? `${open} open` : "none open";
  return `<div class="nfh-rt-head">
    <span><span class="nfh-rt-title">Retals</span> <span class="nfh-rt-muted">${summary}</span></span>
    <button type="button" class="nfh-cw-chip${ui.settingsOpen ? " is-armed" : ""}" data-action="settings" aria-expanded="${ui.settingsOpen ? "true" : "false"}">Settings</button>
  </div>`;
}

// The rows, or "" when there is nothing to show.
export function renderList(retals, now, ui = {}) {
  const shown = visibleRetals(retals, now);
  const error = ui.error ? `<div class="nfh-rt-error">${escapeHtml(ui.error)}</div>` : "";
  if (!shown.length) return error;
  return `<ul class="nfh-rt-list">${shown.map((retal) => row(retal, now, ui)).join("")}</ul>${error}`;
}

const MIN_CHOICES = [0, 15, 30, 60, 90, 120, MAX_MIN_SECONDS];

function check(pref, on, label, title = "", disabled = false) {
  return `<label${title ? ` title="${escapeHtml(title)}"` : ""}><input type="checkbox" data-pref="${pref}"${on ? " checked" : ""}${disabled ? " disabled" : ""}> <span>${label}</span></label>`;
}

// `desktop` is "granted", "denied", "default" or "unsupported" (no such
// thing here, as in TornPDA: the option is left out).
export function renderSettings(prefs, desktop) {
  const off = !prefs.show;
  const quiet = off || !prefs.notify;
  const minutes = MIN_CHOICES.map(
    (seconds) => `<option value="${seconds}"${seconds === prefs.minSeconds ? " selected" : ""}>${seconds ? formatLeft(seconds) : "any"}</option>`,
  ).join("");
  const desktopRow =
    desktop === "unsupported"
      ? ""
      : `<div class="nfh-cw-settings-row">${check("desktop", prefs.desktop && desktop === "granted", "Desktop notification", "Also show a notification outside the page", quiet || desktop === "denied")}${
          desktop === "denied" ? ` <span class="nfh-rt-muted">Blocked by the browser for torn.com</span>` : ""
        }</div>`;

  return `<div class="nfh-cw-settings nfh-rt-settings">
    <div class="nfh-cw-settings-row">${check("show", prefs.show, "Show retals", "List who can be hit back here, and pass on what your page sees to nuke.family")}</div>
    <div class="nfh-cw-settings-row">${check("notify", prefs.notify, "Notify me of new retals", "A short notice on the page, once per retal", off)}
      <label>with at least <select data-pref="minSeconds"${quiet ? " disabled" : ""}>${minutes}</select> left</label></div>
    <div class="nfh-cw-settings-row">${check("sound", prefs.sound, "Sound", "One short chime with the notice", quiet)}
      <input type="range" min="0.05" max="1" step="0.05" value="${prefs.volume}" data-pref="volume" aria-label="Volume"${quiet || !prefs.sound ? " disabled" : ""}>
      <button type="button" class="nfh-cw-btn" data-action="test-sound"${quiet || !prefs.sound ? " disabled" : ""}>Test</button></div>
    ${desktopRow}
  </div>`;
}
