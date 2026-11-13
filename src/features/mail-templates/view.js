import { escapeHtml } from "../../core/dom.js";
import { PLACEHOLDERS } from "./placeholders.js";

// Markup for the mail template bar. Pure string building from the
// controller's state; every name from the site goes through escapeHtml.

const SCOPE_LABELS = { messages: "Messages", newsletter: "Newsletter", both: "Both" };

const button = (act, label, { primary = false, id = "", kind = "", title = "", disabled = false, extra = "" } = {}) =>
  `<button type="button" class="nfh-cw-btn${primary ? " nfh-cw-btn--primary" : ""}" data-act="${act}"${id !== "" ? ` data-id="${escapeHtml(id)}"` : ""}${
    kind ? ` data-kind="${kind}"` : ""
  }${title ? ` title="${escapeHtml(title)}"` : ""}${disabled ? " disabled" : ""}${extra}>${label}</button>`;

const star = (pinned) => (pinned ? "★" : "☆");

function pinnedChips(list) {
  const chips = [];
  for (const template of list.personal || []) {
    if (template.pinned) chips.push(chipFor("personal", template.id, template.name, "Your template"));
  }
  for (const template of list.faction || []) {
    if (template.pinned) chips.push(chipFor("faction", template.id, template.name, `Faction template · ${template.audience}`));
  }
  return chips.join("");
}

const chipFor = (kind, id, name, title) =>
  `<button type="button" class="nfh-cw-chip nfh-mt-chip nfh-mt-chip--${kind}" data-act="use" data-kind="${kind}" data-id="${escapeHtml(id)}" title="${escapeHtml(
    `${title}: put it in the editor`,
  )}">${kind === "faction" ? '<span class="nfh-mt-badge" aria-label="Faction">F</span>' : ""}${escapeHtml(name)}</button>`;

function scopeSelect(field, selected) {
  return `<select class="nfh-cw-input" data-field="${field}" aria-label="Where it shows">${Object.entries(SCOPE_LABELS)
    .map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`)
    .join("")}</select>`;
}

function formHtml(state) {
  const form = state.form;
  if (!form) return "";
  if (form.mode === "save") {
    return `<div class="nfh-mt-form">
      <input type="text" class="nfh-cw-input" data-field="name" maxlength="80" placeholder="Template name" value="${escapeHtml(form.name)}">
      <label class="nfh-cw-muted">Show in ${scopeSelect("scope", form.scope)}</label>
      ${button("save-confirm", state.busy ? "Saving…" : "Save template", { primary: true, disabled: state.busy })}${button("form-cancel", "Cancel")}
      <div class="nfh-cw-muted nfh-mt-note">Saves the message as it is in the editor${state.hasSubject ? ", and the subject" : ""}. Only you can see your templates.</div>
    </div>`;
  }
  return `<div class="nfh-mt-form">
    <input type="text" class="nfh-cw-input" data-field="name" maxlength="80" value="${escapeHtml(form.name)}" aria-label="Template name">
    <label class="nfh-cw-muted">Show in ${scopeSelect("scope", form.scope)}</label>
    ${button("rename-confirm", "Save", { primary: true, id: form.id, disabled: state.busy })}${button("form-cancel", "Cancel")}
  </div>`;
}

function confirmHtml(state) {
  const confirm = state.confirm;
  if (!confirm) return "";
  return `<div class="nfh-mt-confirm"><span>${escapeHtml(confirm.text)}</span>
    ${button("confirm-yes", escapeHtml(confirm.yes), { primary: true, disabled: state.busy })}${button("confirm-no", "Cancel")}</div>`;
}

function helpHtml(state) {
  if (!state.help) return "";
  const rows = PLACEHOLDERS.filter((placeholder) => !placeholder.where || placeholder.where === state.page)
    .map((placeholder) => `<li><code>{${placeholder.key}}</code> ${escapeHtml(placeholder.label)}</li>`)
    .join("");
  const recipient = state.page === "messages" ? " Pick the recipient before you use a template with <code>{name}</code> or <code>{id}</code>." : "";
  return `<div class="nfh-mt-help">
    <div>Write these in a template (in the message or the subject) and they are filled in when you use it:</div>
    <ul>${rows}</ul>
    <div class="nfh-cw-muted">Anything that can't be filled in yet is left as it is, and you are told.${recipient}</div>
  </div>`;
}

const matches = (query, ...texts) => !query || texts.some((text) => String(text || "").toLowerCase().includes(query));

function allHtml(state) {
  if (!state.open || !state.list) return "";
  const list = state.list;
  const query = state.query.trim().toLowerCase();
  const sections = [];

  const personal = (list.personal || []).filter((template) => matches(query, template.name, template.subject));
  sections.push(`<div class="nfh-mt-section"><div class="nfh-mt-heading">Your templates</div>${
    personal.length
      ? personal
          .map(
            (template) => `<div class="nfh-mt-row">
              <span class="nfh-mt-name" title="${escapeHtml(template.subject || "")}">${escapeHtml(template.name)}</span>
              <span class="nfh-cw-muted nfh-mt-scope">${SCOPE_LABELS[template.scope] || ""}</span>
              <span class="nfh-cw-actions">
                ${button("use", "Use", { primary: true, id: template.id, kind: "personal" })}
                ${button("pin", star(template.pinned), { id: template.id, kind: "personal", title: template.pinned ? "Unpin" : "Pin to the bar" })}
                ${button("rename", "Rename", { id: template.id })}
                ${button("overwrite", "Update", { id: template.id, title: "Replace it with what is in the editor now" })}
                ${button("delete", "Delete", { id: template.id })}
              </span></div>`,
          )
          .join("")
      : `<div class="nfh-cw-muted">${query ? "None match." : "None yet: write a message and press Save."}</div>`
  }</div>`);

  if (list.faction) {
    const faction = list.faction.filter((template) => matches(query, template.name, template.audience));
    sections.push(`<div class="nfh-mt-section"><div class="nfh-mt-heading">Faction templates</div>${
      faction.length
        ? faction
            .map(
              (template) => `<div class="nfh-mt-row">
                <span class="nfh-mt-name">${escapeHtml(template.name)}</span>
                <span class="nfh-cw-muted nfh-mt-scope">${escapeHtml(template.audience)}</span>
                <span class="nfh-cw-actions">
                  ${button("use", "Use", { primary: true, id: template.id, kind: "faction", title: "Rendered now by nuke.family, with today's figures" })}
                  ${button("pin", star(template.pinned), { id: template.id, kind: "faction", title: template.pinned ? "Unpin" : "Pin to the bar" })}
                  ${template.edit_url ? `<a class="nfh-cw-btn" href="${escapeHtml(template.edit_url)}" target="_blank" rel="noopener">Edit ↗</a>` : ""}
                </span></div>`,
            )
            .join("")
        : `<div class="nfh-cw-muted">${query ? "None match." : "None."}</div>`
    }</div>`);
  }

  if (list.messages && list.messages.length) {
    const messages = list.messages.filter((message) => matches(query, message.subject, message.author));
    if (messages.length) {
      sections.push(`<div class="nfh-mt-section"><div class="nfh-mt-heading">Recent faction mail</div>${messages
        .map(
          (message) => `<div class="nfh-mt-row">
            <span class="nfh-mt-name">${escapeHtml(message.subject || "(no subject)")}</span>
            <span class="nfh-cw-muted nfh-mt-scope">${message.status === "draft" ? "Your draft" : `Sent${message.author ? ` by ${escapeHtml(message.author)}` : ""}`}</span>
            <span class="nfh-cw-actions">
              ${button("use", "Use", { primary: true, id: message.id, kind: "message" })}
              <a class="nfh-cw-btn" href="${escapeHtml(message.url)}" target="_blank" rel="noopener">Open ↗</a>
            </span></div>`,
        )
        .join("")}</div>`);
    }
  }

  const siteLink = list.links && list.links.faction_mail
    ? `<a href="${escapeHtml(list.links.faction_mail)}" target="_blank" rel="noopener">Faction mail on nuke.family ↗</a>`
    : "";
  return `<div class="nfh-mt-all">
    <input type="search" class="nfh-cw-input nfh-mt-search" data-field="query" placeholder="Search templates" value="${escapeHtml(state.query)}">
    ${sections.join("")}
    ${siteLink ? `<div class="nfh-mt-foot">${siteLink}</div>` : ""}
  </div>`;
}

export function renderBar(state) {
  const list = state.list;
  const total = list ? (list.personal || []).length + (list.faction || []).length : 0;
  const pins = list ? pinnedChips(list) : "";
  const status = state.loading
    ? `<span class="nfh-cw-muted">Loading…</span>`
    : state.error && !list
      ? `<span class="nfh-cw-error">${escapeHtml(state.error)}</span>`
      : pins || `<span class="nfh-cw-muted">${total ? "Pin templates (☆ in All) to show them here." : "Save a message to use it again later."}</span>`;

  const message = state.message
    ? `<div class="nfh-mt-message nfh-mt-message--${state.message.tone}" role="status">${escapeHtml(state.message.text)}</div>`
    : "";

  return `<div class="nfh-cw-bar nfh-mt-bar">
      <span class="nfh-mt-title">Templates</span>
      <span class="nfh-mt-pins">${status}</span>
      <span class="nfh-cw-actions nfh-mt-buttons">
        ${button("toggle-all", `All${total ? ` (${total})` : ""} ${state.open ? "▴" : "▾"}`, { disabled: !list })}
        ${button("save", state.form?.mode === "save" ? "Save template" : "Save", { disabled: state.busy || !list, primary: state.form?.mode === "save" })}
        ${button("help", "?", { title: "Placeholders you can use", extra: ' aria-label="Placeholders"' })}
      </span>
    </div>
    ${message}${confirmHtml(state)}${formHtml(state)}${helpHtml(state)}${allHtml(state)}`;
}
