import { api, ApiError } from "../../core/api.js";
import { spawnBadges, spawnPanelHtml, TIERS } from "./spawn-plan-logic.js";

// The spawn planner for OC staff, beside Torn's spawn buttons on the Recruiting
// sub-tab: how many crimes of each tier to start so members have somewhere to
// go over the next day, and why. Worked out by nuke.family from its crime sync
// (`/oc/spawn-plan`), so it is just as good in a faction where few members run
// the script; the script only draws it. A small badge goes on each of Torn's
// difficulty buttons ("+1", or a tick when the open slots are enough), and a
// short plan with the reasons goes under the spawner. Nothing is spawned for
// anyone: staff press Torn's own buttons.

const PLAN_KEY = "nfhOcSpawnPlan";
const FRESH_MS = 5 * 60 * 1000;
// A refusal (not OC staff, or a site without the planner) is remembered this long.
const REFUSED_MS = 12 * 60 * 60 * 1000;

export const SPAWNER_SELECTOR = '[class*="manualSpawnerContainer"]';
export const PANEL_ID = "nfh-oc-plan";
export const BADGE_CLASS = "nfh-oc-plan-badge";


function readCache() {
  try {
    return JSON.parse(localStorage.getItem(PLAN_KEY) || "null");
  } catch (e) {
    return null;
  }
}

// The plan as last fetched (`{ plan, fetchedAt, refused }`), or null.
export function cachedSpawnPlan() {
  const cached = readCache();
  if (!cached) return null;
  const age = Date.now() - cached.fetchedAt;
  if (cached.refused) return age < REFUSED_MS ? cached : null;
  return cached;
}

let request = null;

// Fetch the plan when the cached one is over five minutes old. Resolves with
// true when a fresh one arrived. Never throws.
export function refreshSpawnPlan() {
  const cached = cachedSpawnPlan();
  if (cached && Date.now() - cached.fetchedAt < (cached.refused ? REFUSED_MS : FRESH_MS)) return Promise.resolve(false);
  if (request) return request;
  request = api("/oc/spawn-plan")
    .then((response) => {
      localStorage.setItem(PLAN_KEY, JSON.stringify({ plan: response.data, fetchedAt: Date.now() }));
      return true;
    })
    .catch((error) => {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
        localStorage.setItem(PLAN_KEY, JSON.stringify({ refused: true, fetchedAt: Date.now() }));
      }
      return false;
    })
    .finally(() => {
      request = null;
    });
  return request;
}

// True for the panel, a badge, or anything inside them (the crimes page's
// observer ignores what this draws).
export function isSpawnPlanElement(node) {
  const element = node && node.nodeType === Node.ELEMENT_NODE ? node : node && node.parentElement;
  return Boolean(element && element.closest && element.closest(`#${PANEL_ID}, .${BADGE_CLASS}`));
}

// Draw (or clear, with plan null) the badges and the panel. Idempotent: an
// element is only rewritten when its content changed.
export function renderSpawnPlan(root, plan) {
  const spawner = root.querySelector(SPAWNER_SELECTOR);
  const badges = spawner && plan ? spawnBadges(plan) : {};
  if (spawner) {
    for (const button of spawner.querySelectorAll('button[class*="spawnDifficulty___"]')) {
      const tier = TIERS.find((name) => [...button.classList].some((cls) => cls.startsWith(`${name}___`)));
      const badge = tier ? badges[tier] : null;
      let el = button.querySelector(`.${BADGE_CLASS}`);
      if (!badge) {
        if (el) el.remove();
        continue;
      }
      if (!el) {
        el = document.createElement("span");
        el.className = BADGE_CLASS;
        button.appendChild(el);
      }
      const cls = `${BADGE_CLASS} ${BADGE_CLASS}--${badge.tone}`;
      if (el.className !== cls) el.className = cls;
      if (el.textContent !== badge.text) el.textContent = badge.text;
      if (el.title !== badge.title) el.title = badge.title;
    }
  }

  let panel = document.getElementById(PANEL_ID);
  const html = spawner && plan ? spawnPanelHtml(plan) : "";
  if (!html) {
    if (panel) panel.remove();
    return;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "nfh-oc-plan";
  }
  if (panel.previousElementSibling !== spawner) spawner.after(panel);
  if (panel.dataset.nfhHtml !== html) {
    // Keep whatever the member had folded open across a refresh of the plan.
    const open = new Set([...panel.querySelectorAll("details[open]")].map((el) => el.dataset.nfhKey));
    panel.dataset.nfhHtml = html;
    panel.innerHTML = html;
    for (const el of panel.querySelectorAll("details[data-nfh-key]")) {
      if (open.has(el.dataset.nfhKey)) el.open = true;
    }
  }
}
