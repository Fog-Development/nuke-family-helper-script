import { api, ApiError } from "../../core/api.js";
import { escapeHtml } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { crimeChoices, defaultCrimeFor, quoteLine } from "./logic.js";

// The OC fine form, shared by the profile box and the crimes page's staff
// flags. Everything comes from nuke.family (/oc-fines/context): the reasons
// the faction uses, the crimes the fine could name (current, recently left or
// removed from, last finished) and what the next strike would be. Issuing is
// one POST; the site posts the fine to the faction's Discord with its mail.
//
// opts: { playerId, reason?, crime?: { id, label }, details?, onIssued? }

function describeError(error, fallback) {
  if (error instanceof ApiError) {
    if (error.body && error.body.message) return error.body.message;
    if (error.status === 403) return "You can't give OC fines to this member.";
  }
  return fallback;
}

export async function openFineForm(container, opts) {
  container.innerHTML = `<div class="nfh-ocf-form nfh-cw-muted">Loading…</div>`;

  let context;
  try {
    const params = new URLSearchParams({ player_id: String(opts.playerId) });
    if (opts.crime && opts.crime.id) params.set("crime_id", String(opts.crime.id));
    context = (await api(`/oc-fines/context?${params}`)).data;
  } catch (error) {
    container.innerHTML = `<div class="nfh-ocf-form nfh-ocf-error">${escapeHtml(describeError(error, "Couldn't reach nuke.family."))}</div>`;
    return;
  }

  const state = {
    reason: opts.reason && context.reasons.some((r) => r.key === opts.reason) ? opts.reason : "",
    crime: null,
    note: "",
    busy: false,
    error: null,
    issued: null,
  };
  state.crime = state.reason ? defaultCrimeFor(context, state.reason, opts.crime ? opts.crime.id : null) : null;

  const render = () => {
    if (state.issued) {
      const fine = state.issued;
      container.innerHTML = `<div class="nfh-ocf-form nfh-ocf-done">
        ✅ ${fine.kind === "warning" ? "Warning" : "Fine"} #${escapeHtml(fine.id)}: ${escapeHtml(fine.reason_label)}, <strong>${escapeHtml(fine.penalty)}</strong>${
          fine.strike ? ` (strike ${escapeHtml(fine.strike)})` : ""
        }.
        <div class="nfh-ocf-actions">
          <a class="nfh-cw-btn nfh-cw-btn--primary" href="https://www.torn.com/messages.php#/p=compose&XID=${encodeURIComponent(fine.player_id)}">Write the mail</a>
          <a class="nfh-cw-btn" href="${escapeHtml(fine.url)}" target="_blank" rel="noopener">Open on nuke.family</a>
        </div>
        <div class="nfh-cw-muted">The mail is under &ldquo;Recent fines&rdquo; in the template bar on Torn's compose page.</div>
      </div>`;
      return;
    }

    const reason = context.reasons.find((r) => r.key === state.reason);
    const choices = crimeChoices(context, opts.crime);
    const crimeField =
      !reason || reason.crime === "never"
        ? reason
          ? `<div class="nfh-cw-muted">This reason is about not being in a crime, so it names none.</div>`
          : ""
        : `<label class="nfh-ocf-field"><span>Crime</span><select class="nfh-cw-input" data-ocf="crime">
            <option value="">None</option>
            ${choices
              .map((c) => `<option value="${escapeHtml(c.id)}"${c.id === state.crime ? " selected" : ""}>${escapeHtml(c.label)}</option>`)
              .join("")}
          </select></label>`;

    const quote = state.reason ? quoteLine(context, state.reason) : "";

    container.innerHTML = `<div class="nfh-ocf-form">
      <div class="nfh-cw-muted">Fining <strong>${escapeHtml(context.player.name || opts.playerId)}</strong> in ${escapeHtml(context.faction.name)}</div>
      <label class="nfh-ocf-field"><span>Reason</span><select class="nfh-cw-input" data-ocf="reason">
        <option value="">Choose a reason…</option>
        ${context.reasons
          .map((r) => `<option value="${escapeHtml(r.key)}"${r.key === state.reason ? " selected" : ""} title="${escapeHtml(r.description)}">${escapeHtml(r.label)}</option>`)
          .join("")}
      </select></label>
      ${crimeField}
      <label class="nfh-ocf-field"><span>Note${reason && reason.note_required ? " (required)" : ""}</span>
        <textarea class="nfh-cw-input" data-ocf="note" rows="2" maxlength="1000">${escapeHtml(state.note)}</textarea></label>
      ${quote ? `<div class="nfh-ocf-quote">${escapeHtml(quote)}</div>` : ""}
      ${state.error ? `<div class="nfh-ocf-error">${escapeHtml(state.error)}</div>` : ""}
      <div class="nfh-ocf-actions">
        <button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-ocf-act="issue"${state.busy || !state.reason ? " disabled" : ""}>${state.busy ? "Issuing…" : "Issue"}</button>
        <button type="button" class="nfh-cw-btn" data-ocf-act="close">Cancel</button>
      </div>
      ${(context.record || []).length ? recordHtml(context.record) : ""}
    </div>`;
  };

  const issue = async (force = false) => {
    state.busy = true;
    state.error = null;
    render();
    try {
      const payload = {
        player_id: Number(opts.playerId),
        faction_id: context.faction.id,
        reason: state.reason,
        via: "script",
        details: opts.details || {},
      };
      if (state.crime) payload.crime_id = Number(state.crime);
      if (state.note.trim()) payload.note = state.note.trim();
      if (force) payload.force = true;
      const result = await api("/oc-fines", { method: "POST", data: payload });
      state.issued = result.data;
      LogInfo(`[oc-fines] issued fine ${result.data.id} to ${opts.playerId}`);
      if (opts.onIssued) opts.onIssued(result.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && !force) {
        state.error = `${describeError(error, "Already fined.")} Press Issue again to give another anyway.`;
        state.forceNext = true;
      } else {
        state.error = describeError(error, "Couldn't issue the fine. Try again.");
      }
    }
    state.busy = false;
    render();
  };

  container.onchange = (event) => {
    const field = event.target.getAttribute("data-ocf");
    if (field === "reason") {
      state.reason = event.target.value;
      state.crime = defaultCrimeFor(context, state.reason, opts.crime ? opts.crime.id : null);
      state.forceNext = false;
      render();
    } else if (field === "crime") {
      state.crime = event.target.value || null;
    }
  };
  container.oninput = (event) => {
    if (event.target.getAttribute("data-ocf") === "note") state.note = event.target.value;
  };
  container.onclick = (event) => {
    const act = event.target.closest("[data-ocf-act]");
    if (!act) return;
    if (act.getAttribute("data-ocf-act") === "issue" && !state.busy) {
      issue(Boolean(state.forceNext));
    } else if (act.getAttribute("data-ocf-act") === "close") {
      container.innerHTML = "";
      if (opts.onClose) opts.onClose();
    }
  };

  render();
}

function recordHtml(record) {
  return `<details class="nfh-ocf-record"><summary>Their OC record (${record.length})</summary><ul>${record
    .map(
      (fine) =>
        `<li>${escapeHtml(new Date(fine.issued_at * 1000).toISOString().slice(0, 10))} · ${escapeHtml(fine.reason_label)} · ${escapeHtml(fine.penalty)} · ${escapeHtml(fine.status_label)}</li>`,
    )
    .join("")}</ul></details>`;
}
