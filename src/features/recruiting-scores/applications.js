import { api, ApiError } from "../../core/api.js";
import { LogInfo } from "../../core/log.js";
import { IsPage, PageType } from "../../core/pages.js";
import { getOwnPermissions, RECRUITING_PERMISSION } from "../../core/user.js";
import { getRecruitingScoreForPlayer } from "../recruiting.js";
import { clearAll, contentRoot, playerEntries, setDetail, upsertSlot } from "./view.js";

// Recruiting scores on your faction's Controls → Applications, for whoever may
// see recruiting scores (`recruiting.predict`, as on the profile check).
//
// nuke.family scores every application when it first sees it (the full model
// when the applicant shares battle stats, the public one otherwise) and logs
// that check, so this asks for those logged scores in one request for the
// applicants on the page: no new scoring and no new log rows. An application
// the site hasn't scored gets a "Score" button, and one it hasn't seen yet
// (synced every few minutes) a "Check score" on the player's public profile:
// each a deliberate, logged check, like the profile button.
//
// Only reads the page being viewed; the requests all go to nuke.family.

const state = {
  allowed: null, // permission check result, once known
  scores: new Map(), // player id -> the site's answer for them
  asked: new Set(),
  busy: new Set(),
  open: new Set(),
  notes: new Map(), // player id -> error text
  loadError: null,
};

let observer = null;
let observed = null;
let timer = null;

function root() {
  return document.querySelector("#option-application-root") || document.querySelector('[id^="option-application"][id$="-root"]') || contentRoot();
}

function onPage() {
  return IsPage(PageType.FactionControlApplications) && location.search.includes("step=your");
}

async function fetchScores(ids) {
  ids.forEach((id) => state.asked.add(id));
  try {
    const answer = await api("/candidate-score/applicants", { method: "POST", data: { player_ids: ids } });
    for (const applicant of answer.applicants || []) state.scores.set(applicant.player_id, applicant);
    state.loadError = null;
  } catch (error) {
    LogInfo("[recruiting-scores] applicants", error);
    ids.forEach((id) => state.asked.delete(id));
    if (error instanceof ApiError && error.status === 403) state.allowed = false;
    else state.loadError = "Couldn't load recruiting scores from nuke.family.";
  }
  schedule(0);
}

function slotState(id) {
  if (state.busy.has(id)) return { kind: "busy", text: "Scoring…" };
  if (state.notes.has(id)) return { kind: "note", text: "Score unavailable", title: state.notes.get(id) };
  const applicant = state.scores.get(id);
  if (!applicant) {
    return state.loadError ? { kind: "action", action: "retry", label: "Retry scores", title: state.loadError } : state.asked.has(id) ? { kind: "busy" } : null;
  }
  if (applicant.state === "scored") return { kind: "score", data: applicant };
  if (applicant.state === "unscored") {
    return { kind: "action", action: "score-application", label: "Score", title: "This application wasn't scored when it came in. Score it now (the check is logged)." };
  }
  return {
    kind: "action",
    action: "check",
    label: "Check score",
    title: "nuke.family hasn't picked up this application yet. Check the player's public profile score instead (the check is logged).",
  };
}

async function onAction(id, action) {
  if (action === "toggle") {
    state.open.has(id) ? state.open.delete(id) : state.open.add(id);
    schedule(0);
    return;
  }
  if (action === "retry") {
    state.loadError = null;
    schedule(0);
    return;
  }
  if (state.busy.has(id)) return;
  state.busy.add(id);
  state.notes.delete(id);
  schedule(0);
  try {
    const applicant = state.scores.get(id);
    const data =
      action === "score-application" && applicant?.application_id
        ? await scoreApplication(applicant.application_id)
        : await getRecruitingScoreForPlayer(id);
    state.scores.set(id, { ...applicant, ...data, player_id: id, state: "scored" });
    state.open.add(id);
  } catch (error) {
    state.notes.set(id, error.message || "Scoring failed.");
  } finally {
    state.busy.delete(id);
    schedule(0);
  }
}

async function scoreApplication(applicationId) {
  try {
    return await api(`/candidate-score/applications/${applicationId}`);
  } catch (error) {
    if (error instanceof ApiError && error.body?.error) throw new Error(error.body.error);
    throw new Error("Couldn't score this application.");
  }
}

function redraw() {
  if (!onPage()) return;
  const element = root();
  if (!element || state.allowed !== true) return;
  observe(element);
  const entries = playerEntries(element);
  const missing = entries.map((entry) => entry.id).filter((id) => !state.scores.has(id) && !state.asked.has(id));
  if (missing.length && !state.loadError) fetchScores(missing.slice(0, 100));
  for (const entry of entries) {
    upsertSlot(entry, slotState(entry.id), onAction);
    const applicant = state.scores.get(entry.id);
    setDetail(entry, state.open.has(entry.id) && applicant?.state === "scored" ? applicant : null, (id) => {
      state.open.delete(id);
      schedule(0);
    });
  }
}

function schedule(delay = 250) {
  clearTimeout(timer);
  timer = setTimeout(redraw, delay);
}

function observe(element) {
  const target = element.parentElement || element;
  if (observed === target) return;
  observer?.disconnect();
  observed = target;
  observer = new MutationObserver((records) => {
    const ours = records.every((record) =>
      [...record.addedNodes, ...record.removedNodes].every((node) => node.nodeType !== 1 || node.closest?.(".nfh-rs-slot, .nfh-rs-detail") || /(^|\s)nfh-rs/.test(node.className || "")),
    );
    if (!ours) schedule();
  });
  observer.observe(target, { childList: true, subtree: true });
}

export default {
  name: "Recruiting scores: applications",
  pages: [PageType.FactionControlApplications, PageType.Faction],
  async init() {
    if (!onPage()) {
      observer?.disconnect();
      observed = null;
      return;
    }
    if (state.allowed === null) {
      const permissions = await getOwnPermissions();
      state.allowed = permissions.includes(RECRUITING_PERMISSION);
    }
    if (!state.allowed) {
      clearAll();
      return;
    }
    // Torn draws the list after the tab opens: look again for a few seconds.
    let tries = 12;
    const attach = () => {
      redraw();
      if (--tries > 0 && onPage()) setTimeout(attach, 500);
    };
    attach();
  },
};
