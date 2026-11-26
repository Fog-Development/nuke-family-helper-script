import { escapeHtml } from "../../core/dom.js";

// The spawn plan's badges and panel as text (pure, unit tested): see spawn-plan.js.

// Torn's button for each tier carries the tier's name as a (build-hashed) class.
export const TIERS = ["lambda", "sigma", "phi", "psi", "omega"];

// The letter on each of Torn's buttons, so a row of the plan reads like the button it's about.
const SYMBOLS = { lambda: "Λ", sigma: "Σ", phi: "Φ", psi: "Ψ", omega: "Ω" };

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

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

function tierHtml(tier) {
  const free = (tier.seeking || 0) + (tier.back_later || 0);
  const verdict =
    tier.spawn > 0
      ? `<span class="nfh-oc-plan__verdict nfh-oc-plan__verdict--spawn">Spawn ${tier.spawn}</span>` +
        `<span class="nfh-oc-plan__muted">${tier.spawn * tier.scope_cost} scope</span>`
      : '<span class="nfh-oc-plan__verdict nfh-oc-plan__verdict--ok">Enough open</span>';
  const summary = [plural(free, "member free soon", "members free soon"), plural(tier.open_slots_taken || 0, "open slot fits", "open slots fit")];
  const why = (tier.reasons || []).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  return (
    `<details class="nfh-oc-plan__row${tier.below_productive ? " nfh-oc-plan__row--quiet" : ""}" data-nfh-key="tier-${escapeHtml(tier.tier)}">` +
    "<summary>" +
    `<span class="nfh-oc-plan__symbol" aria-hidden="true">${SYMBOLS[tier.tier] || ""}</span>` +
    `<span class="nfh-oc-plan__name">${escapeHtml(tier.label)} <span class="nfh-oc-plan__muted">${escapeHtml((tier.levels || []).join("–"))}</span></span>` +
    verdict +
    `<span class="nfh-oc-plan__summary">${summary.join(" · ")}</span>` +
    "</summary>" +
    `<ul class="nfh-oc-plan__why">${why}</ul>` +
    "</details>"
  );
}

function risksHtml(risks) {
  if (!risks.length) return "";
  const items = risks
    .map(
      (risk) =>
        `<li>${escapeHtml(risk.crime_name)} <span class="nfh-oc-plan__muted">L${escapeHtml(risk.level)}</span>: ` +
        `${plural(risk.open_slots, "open role", "open roles")}${risk.stalled ? ", stalled" : ""}</li>`,
    )
    .join("");
  return (
    '<details class="nfh-oc-plan__row nfh-oc-plan__risks" data-nfh-key="risks"><summary>' +
    '<span class="nfh-oc-plan__symbol" aria-hidden="true">!</span>' +
    `<span>${plural(risks.length, "started crime has", "started crimes have")} open roles nobody is due to take in the next two days</span>` +
    `</summary><ul class="nfh-oc-plan__why">${items}</ul></details>`
  );
}

function gradingHtml(grading) {
  if (!grading || !grading.suggestions) return "";
  const waiting = (value) => (value === null || value === undefined ? "–" : String(value));
  return (
    '<div class="nfh-oc-plan__grading">' +
    `Last 14 days: ${plural(grading.suggestions, "suggestion", "suggestions")}, ` +
    `${grading.followed === null ? "–" : `${Math.round(grading.followed * 100)}%`} followed; ` +
    `members still waiting 6h later: ${waiting(grading.waiting_when_followed)} when followed, ${waiting(grading.waiting_when_not)} when not.` +
    "</div>"
  );
}

// The panel under the spawner (pure HTML), or "" when there is nothing to say.
// One line per tier, highest first; the reasons and the crimes to fill first
// fold open on a click.
export function spawnPanelHtml(plan) {
  if (!plan || !plan.enabled || !Array.isArray(plan.tiers)) return "";
  const tiers = [...plan.tiers].sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier));
  const idle = plan.idle_without_slot
    ? `<span class="nfh-oc-plan__alert">${plural(plan.idle_without_slot, "member", "members")} in no crime with nothing open</span>`
    : "";
  const body = tiers.length
    ? tiers.map(tierHtml).join("")
    : '<div class="nfh-oc-plan__muted">Nobody is due to look for a crime in the next day.</div>';

  return (
    '<div class="nfh-oc-plan__head"><strong>Spawn plan</strong>' +
    `<span class="nfh-oc-plan__muted">next ${plan.horizon_hours || 24}h · click a line for why</span>${idle}</div>` +
    body +
    risksHtml(plan.stall_risks || []) +
    gradingHtml(plan.grading)
  );
}
