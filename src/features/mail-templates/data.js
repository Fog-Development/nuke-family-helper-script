import { api } from "../../core/api.js";

// nuke.family calls for the mail template bar (`/mail-templates…`).
//
// The list (names only) and personal template bodies are kept for five
// minutes, in memory and in localStorage so the next page load needs no call.
// Faction mail templates and messages are never kept: they are rendered by
// the site the moment they are used, so they always carry today's figures.
// Any change made from the bar drops the copies.

const TTL_MS = 5 * 60 * 1000;
const LIST_KEY = "nfhMailTemplateList";
const BODY_KEY = "nfhMailTemplateBodies";

const memory = { list: {}, bodies: {} };

function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch (error) {
    return {};
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Full or blocked storage: memory still works for this page.
  }
}

const fresh = (entry) => entry && Date.now() - entry.at < TTL_MS;

export function forgetCaches() {
  memory.list = {};
  memory.bodies = {};
  try {
    localStorage.removeItem(LIST_KEY);
    localStorage.removeItem(BODY_KEY);
  } catch (error) {
    // nothing kept
  }
}

// { personal: [...], faction: [...]|null, messages: [...]|null, links }
export async function listTemplates(page, { force = false } = {}) {
  if (!force) {
    const cached = memory.list[page] || readStore(LIST_KEY)[page];
    if (fresh(cached)) {
      memory.list[page] = cached;
      return cached.data;
    }
  }
  const data = await api(`/mail-templates?page=${encodeURIComponent(page)}`);
  const entry = { at: Date.now(), data };
  memory.list[page] = entry;
  const stored = readStore(LIST_KEY);
  stored[page] = entry;
  writeStore(LIST_KEY, stored);
  return data;
}

export async function personalBody(id) {
  const cached = memory.bodies[id] || readStore(BODY_KEY)[id];
  if (fresh(cached)) return cached.data;
  const data = await api(`/mail-templates/personal/${id}`);
  const entry = { at: Date.now(), data };
  memory.bodies[id] = entry;
  // Keep only fresh bodies, so the store never grows past what was used lately.
  const stored = Object.fromEntries(Object.entries(readStore(BODY_KEY)).filter(([, value]) => fresh(value)));
  stored[id] = entry;
  writeStore(BODY_KEY, stored);
  return data;
}

export async function savePersonal(fields) {
  const result = await api("/mail-templates/personal", { method: "POST", data: fields });
  forgetCaches();
  return result;
}

export async function updatePersonal(id, fields) {
  const result = await api(`/mail-templates/personal/${id}`, { method: "POST", data: fields });
  forgetCaches();
  return result;
}

export async function deletePersonal(id) {
  const result = await api(`/mail-templates/personal/${id}/delete`, { method: "POST" });
  forgetCaches();
  return result;
}

export const renderFaction = (id) => api(`/mail-templates/faction/${id}`);

export const factionMessage = (uuid) => api(`/mail-templates/messages/${encodeURIComponent(uuid)}`);

export async function pinFaction(id, pinned) {
  const result = await api(`/mail-templates/faction/${id}/pin`, { method: "POST", data: { pinned } });
  forgetCaches();
  return result;
}

// OC fines (docs/oc-fines-plan.md in the site's repository): the list above
// carries staff's recent unmailed fines; their mail is rendered by the site
// when used, and the member marks it mailed after sending it.
export const fineMail = (id) => api(`/oc-fines/${id}/mail`);

export async function markFineMailed(id) {
  const result = await api(`/oc-fines/${id}/mailed`, { method: "POST", data: { mailed: true, via: "script" } });
  forgetCaches();
  return result;
}
