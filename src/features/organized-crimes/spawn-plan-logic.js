import { escapeHtml } from "../../core/dom.js";

// The spawn plan's badges and panel as text (pure, unit tested): see spawn-plan.js.

// Torn's button for each tier carries the tier's name as a (build-hashed) class.
export const TIERS = ["lambda", "sigma", "phi", "psi", "omega"];

// The badge for each tier's button (pure): `{ text, tone, title }`, or nothing
// for a tier nobody is looking at.
export function spawnBadges(plan) {
  const badges = {};
  if (!plan || !plan.enabled || !Array.isArray(plan.tiers)) return badges;
  for (const tier of plan.tiers) {
    if (tier.spawn > 0) {
      badges[tier.tier] = {
        text: `+${tier.spawn}`,
        tone: tier.below_productive ? "quiet" : "spawn",
        title: `Spawn ${tier.spawn}: ${(tier.reasons || []).join("; ")}`,
      };
    } else if (tier.seeking > 0 || tier.back_later > 0) {
      badges[tier.tier] = { text: "✓", tone: "ok", title: `Enough open: ${(tier.reasons || []).join("; ")}` };
    }
  }
  return badges;
}

const levels = (tier) => (tier.levels || []).join("–");

function tierHtml(tier) {
  const action =
    tier.spawn > 0
      ? `<span class="nfh-oc-spawn__count">Spawn ${tier.spawn}</span><span class="nfh-oc-spawn__muted">${tier.spawn * tier.scope_cost} scope</span>`
      : '<span class="nfh-oc-spawn__count nfh-oc-spawn__count--ok">Enough open</span>';
  const why = (tier.reasons || []).map((reason) => escapeHtml(reason)).join(" · ");
  return (
    `<li class="nfh-oc-spawn__tier${tier.spawn > 0 ? " nfh-oc-spawn__tier--spawn" : ""}${tier.below_productive ? " nfh-oc-spawn__tier--quiet" : ""}" data-nfh-tier="${escapeHtml(tier.tier)}">` +
    `<span class="nfh-oc-spawn__name">${escapeHtml(tier.label)} <span class="nfh-oc-spawn__muted">L${escapeHtml(levels(tier))}</span></span>` +
    action +
    `<span class="nfh-oc-spawn__why">${why}</span>` +
    "</li>"
  );
}

function gradingHtml(grading) {
  if (!grading || !grading.suggestions) return "";
  const percent = (value) => `${Math.round(value * 100)}%`;
  const waiting = (value) => (value === null || value === undefined ? "–" : String(value));
  return (
    '<div class="nfh-oc-spawn__grading">' +
    `Last 14 days: ${grading.suggestions} suggestion${grading.suggestions === 1 ? "" : "s"}, ` +
    `${grading.followed === null ? "–" : percent(grading.followed)} followed. ` +
    `Members still waiting 6h later: ${waiting(grading.waiting_when_followed)} when followed, ${waiting(grading.waiting_when_not)} when not.` +
    "</div>"
  );
}

// The panel under the spawner (pure HTML), or "" when there is nothing to say.
export function spawnPanelHtml(plan) {
  if (!plan || !plan.enabled || !Array.isArray(plan.tiers)) return "";
  const tiers = [...plan.tiers].sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier));
  const risks = (plan.stall_risks || [])
    .map(
      (risk) =>
        `<li>${escapeHtml(risk.crime_name)} <span class="nfh-oc-spawn__muted">L${escapeHtml(risk.level)}</span>: ` +
        `${risk.open_slots} open ${risk.open_slots === 1 ? "role" : "roles"}${risk.stalled ? ", stalled" : ""} and nobody due to take ${risk.open_slots === 1 ? "it" : "them"} today</li>`,
    )
    .join("");
  const idle = plan.idle_without_slot
    ? `<div class="nfh-oc-spawn__alert">${plan.idle_without_slot} member${plan.idle_without_slot === 1 ? " is" : "s are"} in no crime with nothing open for them right now.</div>`
    : "";
  const body = tiers.length
    ? `<ul class="nfh-oc-spawn__tiers">${tiers.map(tierHtml).join("")}</ul>`
    : '<div class="nfh-oc-spawn__muted">Nobody is due to look for a crime in the next day.</div>';

  return (
    '<div class="nfh-oc-spawn__head"><strong>Spawn plan</strong>' +
    `<span class="nfh-oc-spawn__muted">next ${plan.horizon_hours || 24}h, from nuke.family</span></div>` +
    idle +
    body +
    (risks ? `<div class="nfh-oc-spawn__risks">Fill first:<ul>${risks}</ul></div>` : "") +
    gradingHtml(plan.grading)
  );
}
