import { escapeHtml } from "../../core/dom.js";
import { renderRecruitingScore } from "../recruiting.js";
import { badgeParts, badgeTitle, playerIdFromHref } from "./logic.js";

// Badges and the reasons panel, shared by the Applications page and "Score
// this page". Every player gets one `.nfh-rs-slot` right after their name; it
// holds the badge, a button, or a short note. Clicking a badge opens the
// profile check's own breakdown (sub-scores with what raised and lowered each)
// in a panel at the end of the player's row.

// Torn's main content column (never the sidebar, header or chat).
export function contentRoot() {
  return document.querySelector("#mainContainer .content-wrapper") || document.querySelector(".content-wrapper");
}

function shown(element) {
  return element.getClientRects().length > 0;
}

// One entry per player listed in `root`, at their name link (the avatar link,
// when a row has one, has no text). Links inside our own panels don't count.
export function playerEntries(root) {
  const seen = new Map();
  if (!root) return [];
  for (const link of root.querySelectorAll('a[href*="profiles.php?XID="]')) {
    if (link.closest(".nfh-rs-detail, .nfh-cw, .nfh-rs-slot") || !shown(link)) continue;
    const id = playerIdFromHref(link.getAttribute("href"));
    if (!id) continue;
    const named = link.textContent.trim() !== "";
    const current = seen.get(id);
    if (!current || (!current.named && named)) seen.set(id, { id, link, named });
  }
  return [...seen.values()].map(({ id, link }) => {
    // Torn's honor bars wrap the name link; the badge goes after the bar.
    const host = link.closest(".honorWrap, [class*='honorWrap']") || link;
    const row = link.closest("li, tr, [class*='rowWrapper___'], [class*='row___']") || host.parentElement;
    return { id, link, host, row };
  });
}

export function badgeHtml(data) {
  const parts = badgeParts(data);
  const tier = (value) => (value.tier ? ` nfh-rs--${value.tier}` : "");
  const subs = [...parts.subs].sort((a, b) => Number(!!b.highlight) - Number(!!a.highlight));
  return (
    `<b class="nfh-rs-c${tier(parts.composite)}">${escapeHtml(parts.composite.text)}</b>` +
    subs
      .map((sub) => `<span class="nfh-rs-sub${sub.highlight ? " nfh-rs-sub--ks" : ""}${tier(sub)}">${escapeHtml(sub.short)}${escapeHtml(sub.text)}</span>`)
      .join("")
  );
}

// What a slot can show: { kind: "score", data } | { kind: "busy", text } |
// { kind: "action", action, label, title } | { kind: "note", text, title }.
function slotContent(state) {
  if (state.kind === "score") {
    return {
      html: `<button type="button" class="nfh-rs-badge" data-rs-action="toggle">${badgeHtml(state.data)}</button>`,
      title: badgeTitle(state.data),
    };
  }
  if (state.kind === "busy") return { html: `<span class="nfh-rs-note">${escapeHtml(state.text || "…")}</span>`, title: "Scoring…" };
  if (state.kind === "action") {
    return { html: `<button type="button" class="nfh-rs-action" data-rs-action="${escapeHtml(state.action)}">${escapeHtml(state.label)}</button>`, title: state.title || "" };
  }
  return { html: `<span class="nfh-rs-note">${escapeHtml(state.text)}</span>`, title: state.title || "" };
}

// Put `state` in the player's slot, creating it after their name.
// `onAction(id, action)` is called for the slot's buttons.
export function upsertSlot(entry, state, onAction) {
  let slot = entry.host.nextElementSibling;
  if (!slot || !slot.classList.contains("nfh-rs-slot") || Number(slot.dataset.player) !== entry.id) {
    slot = document.createElement("span");
    slot.className = "nfh-rs-slot";
    slot.dataset.player = String(entry.id);
    slot.addEventListener("click", (event) => {
      const button = event.target.closest("[data-rs-action]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      onAction(Number(slot.dataset.player), button.dataset.rsAction);
    });
    entry.host.insertAdjacentElement("afterend", slot);
  }
  if (!state) {
    slot.remove();
    return;
  }
  const { html, title } = slotContent(state);
  // Compared with what was last drawn, not the live markup, so a slot is only
  // rewritten when its state changed.
  if (slot.dataset.rendered !== html) {
    slot.innerHTML = html;
    slot.dataset.rendered = html;
  }
  if (slot.title !== title) slot.title = title;
}

// The reasons panel at the end of the player's row (inside its cell for a
// table row). `data` null closes it.
export function setDetail(entry, data, onClose) {
  const container = entry.row?.tagName === "TR" ? entry.host.closest("td") || entry.row : entry.row;
  if (!container) return;
  let panel = container.querySelector(`:scope > .nfh-rs-detail[data-player="${entry.id}"]`);
  if (!data) {
    panel?.remove();
    return;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "nfh-cw nfh-rs-detail";
    panel.dataset.player = String(entry.id);
    panel.addEventListener("click", (event) => {
      if (event.target.closest('[data-rs-action="close"]')) {
        event.preventDefault();
        event.stopPropagation();
        onClose(entry.id);
      }
    });
    container.appendChild(panel);
  }
  if (panel.dataset.rendered === JSON.stringify(data)) return;
  panel.dataset.rendered = JSON.stringify(data);
  const body = document.createElement("div");
  body.className = "nfh-rs-detail-body";
  renderRecruitingScore(body, data);
  const scored = data.scored_at ? ` · scored ${escapeHtml(data.scored_at.slice(0, 10))}` : "";
  panel.innerHTML = `<button type="button" class="nfh-cw-btn nfh-rs-close" data-rs-action="close" aria-label="Close">✕</button>
    <div class="nfh-cw-muted nfh-rs-detail-note">▲ raised the score · ▼ lowered it${scored}</div>`;
  panel.appendChild(body);
}

// Everything this feature put on the page, for when the member leaves it.
export function clearAll(root = document) {
  root.querySelectorAll(".nfh-rs-slot, .nfh-rs-detail").forEach((element) => element.remove());
}
