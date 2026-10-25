import { escapeHtml } from "../../core/dom.js";
import { formatLeft, retalState, visibleRetals } from "./logic.js";

// Pure HTML for the retal list under Torn's recent attacks. Every name comes
// from Torn by way of nuke.family, so all of it goes through escapeHtml.

export function profileUrl(playerId) {
  return `/profiles.php?XID=${encodeURIComponent(playerId)}`;
}

export function attackUrl(playerId) {
  return `/page.php?sid=attack&user2ID=${encodeURIComponent(playerId)}`;
}

function enemyName(retal) {
  const name = escapeHtml(retal.enemy_name || `#${retal.enemy_id}`);
  const tag = retal.enemy_faction_tag ? ` <span class="nfh-rt-tag">${escapeHtml(retal.enemy_faction_tag)}</span>` : "";
  return `<a class="nfh-rt-name" href="${profileUrl(retal.enemy_id)}">${name}</a>${tag}`;
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

// The whole list, or "" when there is nothing to show (the list is hidden).
export function renderList(retals, now, ui = {}) {
  const shown = visibleRetals(retals, now);
  if (!shown.length) return "";
  const open = shown.filter((retal) => !retal.done_at).length;
  const error = ui.error ? `<div class="nfh-rt-error">${escapeHtml(ui.error)}</div>` : "";
  return `<div class="nfh-rt-head"><span class="nfh-rt-title">Retals</span> <span class="nfh-rt-muted">${open} open</span></div>
    <ul class="nfh-rt-list">${shown.map((retal) => row(retal, now, ui)).join("")}</ul>${error}`;
}
