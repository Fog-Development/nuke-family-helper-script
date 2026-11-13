import { api, ApiError } from "../../core/api.js";
import { escapeHtml } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { setInputValue } from "../../core/torn-editor.js";
import { activeSubTab, CRIMES_ROOT_SELECTOR } from "../organized-crimes/page.js";
import { cachedBoard, refreshBoard } from "../organized-crimes/remote.js";
import { changeText, formatStat, kickReason, riskTier } from "./logic.js";

// Kick risk on your faction's Controls → Members list, for whoever sees the
// faction monitor's Kick Risk column (nuke.family decides: `/faction-monitor/
// members` answers 403 to anyone else, and the script then stays quiet for
// half a day).
//
// - Each member gets the monitor's kick risk: a dot when low, a small chip
//   when elevated, louder for moderate and high. Clicking it opens a small
//   panel under the row: avgE7 (and its change against avgE30), avgE30,
//   Xanax Daily, and any other figure under the faction's targets, with a
//   link to the full monitor.
// - In Torn's kick confirmation, a suggested public reason built from those
//   figures, filled in on a click. For a member still in an organized crime
//   (Torn refuses the kick), a link to the crimes page and, there, a way back.
// - Once a kicked member's row disappears after the member clicked Yes, an
//   offer to add them to the faction blacklist, reason prefilled.
//
// Nothing here acts on Torn: the reason is typed into Torn's box on a click,
// and kicking stays Torn's own Yes button.

const ROOT = "#option-members-root";
const CACHE_KEY = "nfhKickRisk";
const DENIED_KEY = "nfhKickRiskDenied";
const RETURN_KEY = "nfhKickReturn";
const CACHE_MS = 10 * 60 * 1000;
const DENIED_MS = 12 * 60 * 60 * 1000;
const KICK_WAIT_MS = 30 * 1000;

const state = {
  data: null,
  loading: null,
  open: new Set(),
  pendingKick: null,
  offer: null, // { id, name, reason, welcome, busy, done, error }
};

let observer = null;
let observedRoot = null;
let timer = null;

// ---- data -----------------------------------------------------------------

function readJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // storage full or blocked: only the cache is lost
  }
}

async function load() {
  if (state.data) return state.data;
  if (state.loading) return state.loading;
  const denied = readJson(localStorage, DENIED_KEY);
  if (denied && Date.now() - denied < DENIED_MS) return null;
  const cached = readJson(localStorage, CACHE_KEY);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    state.data = cached.data;
    return state.data;
  }
  state.loading = api("/faction-monitor/members")
    .then((data) => {
      state.data = data;
      writeJson(localStorage, CACHE_KEY, { at: Date.now(), data });
      return data;
    })
    .catch((error) => {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) writeJson(localStorage, DENIED_KEY, Date.now());
      LogInfo("[kick-risk]", error);
      return null;
    })
    .finally(() => {
      state.loading = null;
      schedule();
    });
  return state.loading;
}

const memberById = (id) => (state.data?.members || []).find((member) => member.player_id === Number(id)) || null;

// ---- the Members list -------------------------------------------------------

function rows(root) {
  return [...root.querySelectorAll('[class*="rowWrapper___"]')].map((element) => {
    const link = element.querySelector('[class*="member___"] a[href*="profiles.php?XID="]');
    const id = link ? Number(new URL(link.getAttribute("href"), location.origin).searchParams.get("XID")) : null;
    return { element, id, name: link ? link.textContent.trim() : null };
  });
}

function badgeHtml(member) {
  const tier = riskTier(member.kick_risk);
  const percent = Math.round(member.kick_risk);
  const text = tier === "low" ? "" : tier === "elevated" ? `${percent}%` : `Kick ${percent}%`;
  return { tier, text, title: `Kick risk ${percent}% (faction monitor)${member.kick_risk_note ? ` · ${member.kick_risk_note}` : ""}. Click for details.` };
}

function decorateRow(row) {
  const member = row.id ? memberById(row.id) : null;
  const host = row.element.querySelector('[class*="userInfoBox___"]') || row.element.querySelector('[class*="member___"]');
  let badge = row.element.querySelector(".nfh-kr-badge");
  if (!member || member.kick_risk === null || !host) {
    badge?.remove();
  } else {
    const { tier, text, title } = badgeHtml(member);
    if (!badge) {
      badge = document.createElement("button");
      badge.type = "button";
      badge.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        state.open.has(row.id) ? state.open.delete(row.id) : state.open.add(row.id);
        schedule(0);
      });
      host.appendChild(badge);
    }
    badge.dataset.player = row.id;
    const className = `nfh-kr-badge nfh-kr-badge--${tier}`;
    if (badge.className !== className) badge.className = className;
    if (badge.textContent !== text) badge.textContent = text;
    if (badge.title !== title) badge.title = title;
    badge.setAttribute("aria-label", title);
  }

  // The detail panel, at the end of the row (after Torn's own parts of it).
  let detail = row.element.querySelector(":scope > .nfh-kr-detail");
  if (member && state.open.has(row.id)) {
    const html = detailHtml(member);
    if (!detail) {
      detail = document.createElement("div");
      detail.className = "nfh-cw nfh-kr-detail";
      detail.addEventListener("click", (event) => {
        if (event.target.closest('[data-kr="close"]')) {
          state.open.delete(row.id);
          schedule(0);
        }
      });
      row.element.appendChild(detail);
    }
    if (detail.innerHTML !== html) detail.innerHTML = html;
  } else {
    detail?.remove();
  }

  decorateConfirm(row, member);
}

function statHtml(stat, change) {
  const extra = change !== undefined && change !== null ? ` <span class="nfh-kr-change nfh-kr-change--${change < 0 ? "down" : "up"}">${escapeHtml(changeText(change))}</span>` : "";
  const target = stat.target !== null && stat.target !== undefined ? ` <span class="nfh-cw-muted">target ${escapeHtml(formatStat({ value: stat.target }))}</span>` : "";
  return `<span class="nfh-kr-stat${stat.below_target ? " nfh-kr-stat--below" : ""}"><span class="nfh-cw-muted">${escapeHtml(stat.label)}</span> <strong>${escapeHtml(
    formatStat(stat),
  )}</strong>${extra}${stat.below_target ? target : ""}</span>`;
}

function detailHtml(member) {
  const stats = member.stats.map((stat) => statHtml(stat, stat.key === "avg_daily_energy_spend_7" ? member.energy_change_pct : undefined)).join("");
  const missed = member.missed.length ? `<div class="nfh-kr-missed"><span class="nfh-cw-muted">Below target:</span> ${member.missed.map((stat) => statHtml(stat)).join("")}</div>` : "";
  const monitor = state.data?.monitor_url ? `<a href="${escapeHtml(state.data.monitor_url)}" target="_blank" rel="noopener">Full monitor ↗</a>` : "";
  return `<div class="nfh-kr-detail-head"><strong>Kick risk ${Math.round(member.kick_risk)}%</strong>
      ${member.kick_risk_note ? `<span class="nfh-cw-muted">${escapeHtml(member.kick_risk_note)}</span>` : ""}
      <span class="nfh-kr-detail-links">${monitor} <button type="button" class="nfh-cw-btn" data-kr="close" aria-label="Close">✕</button></span></div>
    <div class="nfh-kr-stats">${stats}</div>${missed}`;
}

// Torn's kick confirmation under a row: a suggested reason, or for a member in
// an OC (Torn's own error says so) the way to their crime.
function decorateConfirm(row, member) {
  const confirm = row.element.querySelector('[class*="confirm___"]');
  let area = confirm?.querySelector(".nfh-kr-kick");
  if (!confirm) return;
  const inOc = !!confirm.querySelector('[class*="kickError___"]') && /organi[sz]ed crime/i.test(confirm.textContent);
  const reason = member ? kickReason(member) : null;
  let html;
  if (inOc) {
    html = `<span>In an organized crime: remove them from it, then come back.</span>
      <a class="nfh-cw-btn" href="#/tab=crimes" data-kr="to-crimes">Find their crime ›</a>`;
  } else if (reason) {
    html = `<span class="nfh-kr-reason"><span class="nfh-cw-muted">Suggested reason:</span> ${escapeHtml(reason)}</span>
      <button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-kr="fill">Fill in</button>
      ${state.data?.monitor_url ? `<a class="nfh-cw-muted" href="${escapeHtml(state.data.monitor_url)}" target="_blank" rel="noopener" title="Targets are set on the faction monitor">${state.data.has_targets ? "Targets" : "Set targets"} on the monitor ↗</a>` : ""}`;
  } else {
    area?.remove();
    return;
  }
  if (!area) {
    area = document.createElement("div");
    area.className = "nfh-cw nfh-kr-kick";
    area.addEventListener("click", (event) => {
      const action = event.target.closest("[data-kr]")?.dataset.kr;
      if (action === "fill") {
        event.preventDefault();
        const input = confirm.querySelector('input[class*="reasonInput___"]');
        setInputValue(input, area.dataset.reason || "");
        input?.focus();
      } else if (action === "to-crimes") {
        writeJson(sessionStorage, RETURN_KEY, { id: row.id, name: row.name });
      }
    });
    confirm.appendChild(area);
  }
  area.dataset.reason = reason || "";
  if (area.innerHTML !== html) area.innerHTML = html;
}

// After the member's own Yes: when the row is gone, Torn kicked them.
function watchKick(root) {
  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest('[class*="confirm___"] button');
      if (!event.isTrusted || !button || button.disabled || button.textContent.trim() !== "Yes") return;
      const element = button.closest('[class*="rowWrapper___"]');
      const row = rows(root).find((candidate) => candidate.element === element);
      if (!row?.id) return;
      const input = element.querySelector('input[class*="reasonInput___"]');
      const member = memberById(row.id);
      state.pendingKick = { id: row.id, name: row.name, reason: input?.value.trim() || (member ? kickReason(member) : ""), at: Date.now() };
    },
    true,
  );
}

function checkKick(root) {
  const pending = state.pendingKick;
  if (!pending) return;
  if (Date.now() - pending.at > KICK_WAIT_MS) {
    state.pendingKick = null;
    return;
  }
  if (rows(root).some((row) => row.id === pending.id)) return;
  state.pendingKick = null;
  state.offer = { id: pending.id, name: pending.name, reason: pending.reason, welcome: false, busy: false, done: false, error: null };
}

function renderOffer(root) {
  let panel = document.getElementById("nfh-kr-blacklist");
  const offer = state.offer;
  if (!offer) {
    panel?.remove();
    return;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "nfh-kr-blacklist";
    panel.className = "nfh-cw nfh-cw--attn nfh-kr-offer";
    panel.addEventListener("click", onOfferClick);
    panel.addEventListener("input", (event) => {
      if (event.target.dataset.kr === "reason") offer.reason = event.target.value;
      if (event.target.dataset.kr === "welcome") offer.welcome = event.target.checked;
    });
    root.parentElement.insertBefore(panel, root);
  }
  const name = escapeHtml(offer.name || `#${offer.id}`);
  if (offer.done) {
    panel.innerHTML = `<div class="nfh-cw-bar"><span class="nfh-cw-ok">Added ${name} to the faction blacklist.</span>
      <button type="button" class="nfh-cw-btn" data-kr="dismiss">OK</button></div>`;
    return;
  }
  if (panel.querySelector('[data-kr="reason"]') && !offer.error && !offer.refresh) return; // keep what is being typed
  offer.refresh = false;
  panel.innerHTML = `<div class="nfh-kr-offer-body">
      <div><strong>${name} was kicked.</strong> Add them to the faction blacklist?</div>
      <textarea class="nfh-cw-input" data-kr="reason" rows="2" maxlength="1000" aria-label="Blacklist reason">${escapeHtml(offer.reason)}</textarea>
      <label><input type="checkbox" data-kr="welcome"${offer.welcome ? " checked" : ""}> Welcome back in Nuke later</label>
      ${offer.error ? `<div class="nfh-cw-error">${escapeHtml(offer.error)}</div>` : ""}
      <div class="nfh-cw-actions"><button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-kr="blacklist"${offer.busy ? " disabled" : ""}>Add to blacklist</button>
      <button type="button" class="nfh-cw-btn" data-kr="dismiss">No thanks</button></div>
    </div>`;
}

async function onOfferClick(event) {
  const action = event.target.closest("[data-kr]")?.dataset.kr;
  const offer = state.offer;
  if (!offer) return;
  if (action === "dismiss") {
    state.offer = null;
    schedule(0);
  } else if (action === "blacklist" && !offer.busy) {
    if (!offer.reason.trim()) {
      offer.error = "Give a reason.";
      schedule(0);
      return;
    }
    offer.busy = true;
    offer.error = null;
    offer.refresh = true;
    schedule(0);
    try {
      const data = { player_id: offer.id, reason: offer.reason.trim() };
      if (offer.welcome) data.is_welcome_to_rejoin = true;
      await api("/script/faction-blacklist", { method: "POST", data });
      offer.done = true;
    } catch (error) {
      offer.error = error instanceof ApiError && error.status === 403 ? "You can't add to the blacklist." : "nuke.family could not be reached. Try again, or add it on the site.";
    } finally {
      offer.busy = false;
      offer.refresh = true;
      schedule(0);
    }
  }
}

function redrawMembers() {
  const root = document.querySelector(ROOT);
  if (!root) return;
  checkKick(root);
  if (state.data) for (const row of rows(root)) decorateRow(row);
  renderOffer(root);
}

// ---- the way back from the crimes page ----------------------------------------

// The member's crime from the OC board (nuke.family, synced every five
// minutes): its name, stage and their role.
function crimeOf(playerId) {
  const board = cachedBoard()?.board;
  for (const crime of board?.crimes || []) {
    const slot = (crime.slots || []).find((candidate) => Number(candidate.player_id) === Number(playerId));
    if (slot) return { name: crime.name, status: crime.status, role: slot.role };
  }
  return null;
}

let findMessage = "";

function renderReturn() {
  const target = readJson(sessionStorage, RETURN_KEY);
  let chip = document.getElementById("nfh-kr-return");
  if (!target) {
    chip?.remove();
    return;
  }
  if (!chip) {
    chip = document.createElement("div");
    chip.id = "nfh-kr-return";
    chip.className = "nfh-cw nfh-kr-return";
    chip.addEventListener("click", (event) => {
      const action = event.target.closest("[data-kr]")?.dataset.kr;
      if (action === "find") {
        const slot = findSlot(target.id);
        if (slot) {
          findMessage = "";
          slot.scrollIntoView({ block: "center", behavior: "smooth" });
          slot.classList.add("nfh-kr-slot");
        } else {
          const crime = crimeOf(target.id);
          findMessage = crime && crime.status && activeSubTab(document.querySelector(CRIMES_ROOT_SELECTOR) || document) !== crime.status.toLowerCase()
            ? `Open the ${crime.status} tab: their crime is there.`
            : "Not on the page yet: scroll down so Torn loads more crimes, then press Find again.";
        }
        renderReturn();
      } else if (action === "back" || action === "dismiss") {
        writeJson(sessionStorage, RETURN_KEY, null);
        findMessage = "";
        chip.remove();
      }
    });
    document.body.appendChild(chip);
    refreshBoard().then(() => renderReturn());
  }
  const crime = crimeOf(target.id);
  const where = crime
    ? ` They're in <strong>${escapeHtml(crime.name)}</strong> (${escapeHtml(crime.status)}) as ${escapeHtml(crime.role)}.`
    : "";
  const html = `<span>Kicking <strong>${escapeHtml(target.name || `#${target.id}`)}</strong>: remove them from their crime first.${where}</span>
    <button type="button" class="nfh-cw-btn" data-kr="find">Find them</button>
    <a class="nfh-cw-btn nfh-cw-btn--primary" href="#/tab=controls&option=members" data-kr="back">Back to Members</a>
    <button type="button" class="nfh-cw-btn" data-kr="dismiss" aria-label="Dismiss">✕</button>
    ${findMessage ? `<span class="nfh-kr-find-note">${escapeHtml(findMessage)}</span>` : ""}`;
  if (chip.innerHTML !== html) chip.innerHTML = html;
  const slot = findSlot(target.id);
  document.querySelectorAll(".nfh-kr-slot").forEach((element) => element !== slot && element.classList.remove("nfh-kr-slot"));
  slot?.classList.add("nfh-kr-slot");
}

// The member's slot on the page: the slot wrapper around their profile link.
function findSlot(id) {
  const link = document.querySelector(`${CRIMES_ROOT_SELECTOR} a[href*="profiles.php?XID=${id}"]`);
  if (!link) return null;
  let element = link.parentElement;
  while (element && element.id !== "faction-crimes-root") {
    if (/(^|\s)wrapper___/.test(element.className) && element.querySelector('[class^="slotHeader___"]')) return element;
    element = element.parentElement;
  }
  return link;
}

// ---- wiring -----------------------------------------------------------------

function schedule(delay = 200) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (/option=members/.test(location.hash)) redrawMembers();
    if (/tab=crimes/.test(location.hash)) renderReturn();
  }, delay);
}

function observe(element) {
  if (observedRoot === element) return;
  observer?.disconnect();
  observedRoot = element;
  observer = new MutationObserver((records) => {
    const ours = records.every((record) =>
      [...record.addedNodes, ...record.removedNodes].every((node) => node.nodeType !== 1 || /(^|\s)nfh-/.test(node.className || "") || node.closest?.('[class*="nfh-kr"]')),
    );
    if (!ours) schedule();
  });
  observer.observe(element, { childList: true, subtree: true });
}

export default {
  name: "Kick risk",
  pages: [PageType.FactionControlMembers, PageType.FactionCrimes, PageType.Faction],
  init() {
    if (!location.search.includes("step=your")) return;
    const onMembers = /tab=controls/.test(location.hash) && /option=members/.test(location.hash);
    const onCrimes = /tab=crimes/.test(location.hash);

    // The way back lasts until it is used, dismissed, or the member goes elsewhere.
    if (!onCrimes) {
      document.getElementById("nfh-kr-return")?.remove();
      document.querySelectorAll(".nfh-kr-slot").forEach((element) => element.classList.remove("nfh-kr-slot"));
      if (!onMembers) writeJson(sessionStorage, RETURN_KEY, null);
    }
    if (onMembers) writeJson(sessionStorage, RETURN_KEY, null);

    if (onCrimes) {
      if (!readJson(sessionStorage, RETURN_KEY)) return;
      renderReturn();
      const root = document.querySelector("#faction-crimes-root");
      if (root) observe(root);
      return;
    }
    if (!onMembers) {
      observer?.disconnect();
      observedRoot = null;
      return;
    }

    let tries = 15;
    const attach = () => {
      const root = document.querySelector(ROOT);
      if (root) {
        if (!root.dataset.nfhKr) {
          root.dataset.nfhKr = "1";
          watchKick(root);
        }
        observe(root.parentElement || root);
        load().then(() => schedule(0));
        schedule(0);
        return;
      }
      if (--tries > 0) setTimeout(attach, 400);
    };
    attach();
  },
};
