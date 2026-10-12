import { escapeHtml } from "../../core/dom.js";
import { MIN_CHAIN_HITS } from "./alert.js";
import { AlertMode, formatAlertTime } from "./prefs.js";

// Pure rendering for the chain watch bar: board payload in, HTML strings out.
// Everything from the API goes through escapeHtml.

const HOUR_MS = 60 * 60 * 1000;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
// Slots listed with who is on them: the running hour and the next two.
const ROSTER_SLOTS = 3;
// How close a slot of yours has to be before the bar asks for attention.
const SOON_MS = 10 * 60 * 1000;

const CHECKIN_STATUS = {
  scheduled: "Scheduled",
  unscheduled: "Unscheduled",
  past_slot: "Past slot, check if active",
};

const pad = (number) => String(number).padStart(2, "0");
const slotStart = (slot) => Date.parse(slot.slot_start_iso);

// Torn time (TCT) is UTC.
function hourLabel(ms) {
  return `${pad(new Date(ms).getUTCHours())}:00`;
}

export function slotLabel(ms) {
  return `${DAYS[new Date(ms).getUTCDay()]} ${hourLabel(ms)}`;
}

function dayLabel(ms) {
  const date = new Date(ms);
  return `${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

function localTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// "7m", "3h 5m", "2d 4h"
export function duration(ms) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function playerName(entry) {
  return entry.player_name || `Player ${entry.player_id}`;
}

function playerLink(entry, className = "") {
  const name = escapeHtml(playerName(entry));
  if (!entry.player_id) return `<span class="${className}">${name}</span>`;
  return `<a class="${className}" href="/profiles.php?XID=${escapeHtml(entry.player_id)}">${name}</a>`;
}

function button(action, label, { primary = false, data = {}, title = "" } = {}) {
  const attributes = Object.entries(data)
    .map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`)
    .join("");
  return (
    `<button type="button" class="nfh-cw-btn${primary ? " nfh-cw-btn--primary" : ""}"` +
    ` data-action="${action}"${attributes}${title ? ` title="${escapeHtml(title)}"` : ""}>${escapeHtml(label)}</button>`
  );
}

// What the board means for the person looking at it right now.
export function summarize(board, now) {
  const slots = board.slots || [];
  const checkins = board.checkins || [];
  const current =
    slots.find((slot) => slotStart(slot) <= now && now < slotStart(slot) + HOUR_MS) ||
    null;
  const mine = slots.filter((slot) => slot.signups.some((signup) => signup.is_me));

  return {
    slots,
    checkins,
    current,
    mine,
    myCheckin: checkins.find((checkin) => checkin.is_me) || null,
    myCurrent: !!current && mine.includes(current),
    myNext: mine.find((slot) => slotStart(slot) > now) || null,
    started: Date.parse(board.start_time) <= now,
    checkedInIds: new Set(checkins.map((checkin) => Number(checkin.player_id))),
  };
}

// The one-line state shown while collapsed: { tone, text (HTML), actions (HTML) }.
// tone: "" | "in" (checked in) | "attn" (needs the user's attention).
function barState(board, summary, now) {
  const { myCheckin, myNext, current } = summary;
  const checkInButton = (primary) => button("checkin", "Check in", { primary });

  if (myCheckin) {
    if (myCheckin.status === "past_slot") {
      return {
        tone: "attn",
        text: "Your slot ended. Still watching?",
        actions:
          button("stay", "Stay on", { primary: true, data: { checkin: myCheckin.id } }) +
          button("checkout", "Check out"),
      };
    }
    const next = myNext ? ` · next slot ${slotLabel(slotStart(myNext))}` : "";
    return {
      tone: "in",
      text: `Checked in · ${duration(now - Date.parse(myCheckin.checked_in_at))}${next}`,
      actions: button("checkout", "Check out"),
    };
  }

  if (summary.myCurrent) {
    return {
      tone: "attn",
      text: "Your slot is running",
      actions: checkInButton(true),
    };
  }

  if (myNext) {
    const wait = slotStart(myNext) - now;
    if (wait <= SOON_MS) {
      return {
        tone: "attn",
        text: `Your slot starts in ${duration(wait)}`,
        actions: checkInButton(true),
      };
    }
    return {
      tone: "",
      text: `Your next slot: ${slotLabel(slotStart(myNext))} TCT · in ${duration(wait)}`,
      actions: summary.started ? checkInButton(false) : "",
    };
  }

  if (!summary.started) {
    const start = Date.parse(board.start_time);
    return {
      tone: "",
      text: `Starts ${slotLabel(start)} TCT · in ${duration(start - now)}`,
      actions: "",
    };
  }

  const watching = summary.checkins.length;
  const open = current ? Math.max(0, current.cap - current.paid_count) : 0;
  return {
    tone: "",
    text:
      `${watching} checked in` +
      (open > 0
        ? ` · <span class="nfh-cw-need">this hour has ${open} open paid spot${open === 1 ? "" : "s"}</span>`
        : ""),
    actions: checkInButton(false),
  };
}

function alertChip(prefs, armed) {
  let label = `Alert ${formatAlertTime(prefs.alertSeconds)}`;
  let title = `Flashes the page when an active chain of more than ${MIN_CHAIN_HITS} hits drops below ${formatAlertTime(prefs.alertSeconds)}. Click for settings.`;
  if (prefs.alertMode === AlertMode.Off) {
    label = "Alert off";
    title = "Chain timer alert is off. Click for settings.";
  } else if (!armed) {
    title =
      prefs.alertMode === AlertMode.Watch
        ? "Chain timer alert is waiting: your faction has no chain watch set up on nuke.family. Click for settings."
        : "Chain timer alert is waiting: you are not checked in to a chain watch. Click for settings.";
  }
  return (
    `<button type="button" class="nfh-cw-chip${armed ? " is-armed" : ""}" data-action="settings"` +
    ` title="${escapeHtml(title)}">${escapeHtml(label)}</button>`
  );
}

// The always-visible bar. `flash` is a transient { text, error } message that
// temporarily replaces the status line.
export function renderBar({ board, watches, prefs, armed, chainActive, flash, busy, now }) {
  const summary = board ? summarize(board, now) : null;
  const state = summary
    ? barState(board, summary, now)
    : { tone: "", text: '<span class="nfh-cw-muted">No chain watch scheduled</span>', actions: "" };

  // Watching a live chain (the alert is armed) while a chain watch is running,
  // without being checked in: a nudge, since check-ins are what the watch
  // sheet records. The louder "your slot" states already say it.
  if (
    summary &&
    summary.started &&
    !summary.myCheckin &&
    chainActive &&
    armed &&
    state.tone !== "attn"
  ) {
    state.text =
      '<span class="nfh-cw-need" title="Check in so your time watching is recorded on the chain watch sheet">Not checked in</span> · ' +
      state.text;
    state.actions = button("checkin", "Check in");
  }

  const title = board && board.title ? `<span class="nfh-cw-title">${escapeHtml(board.title)}</span>` : "";
  const status = flash
    ? `<span class="${flash.error ? "nfh-cw-error" : "nfh-cw-ok"}">${escapeHtml(flash.text)}</span>`
    : state.text;

  const expandable = !!board;
  const expanded = expandable && prefs.expanded;
  const picker =
    watches.length > 1
      ? `<select class="nfh-cw-picker" data-role="watch-picker" title="Chain watch">${watches
          .map(
            (watch) =>
              `<option value="${escapeHtml(watch.id)}"${board && board.id === watch.id ? " selected" : ""}>${escapeHtml(watch.title || `Chain watch #${watch.id}`)}</option>`,
          )
          .join("")}</select>`
      : title;

  return {
    tone: state.tone,
    html:
      `<button type="button" class="nfh-cw-toggle" data-action="toggle"${expandable ? "" : " disabled"}` +
      ` aria-expanded="${expanded}"><span class="nfh-cw-caret">${expandable ? (expanded ? "▾" : "▸") : "·"}</span>Chain Watch</button>` +
      picker +
      `<span class="nfh-cw-status"${expandable ? ' data-action="toggle"' : ""}>${status}</span>` +
      `<span class="nfh-cw-actions${busy ? " is-busy" : ""}">${state.actions}</span>` +
      alertChip(prefs, armed),
  };
}

function rosterSection(summary, board, now) {
  const { slots } = summary;
  if (slots.length === 0) {
    return '<div class="nfh-cw-muted">No open slots in the current signup window.</div>';
  }

  const firstRunning = slotStart(slots[0]) <= now;
  const rows = slots.slice(0, ROSTER_SLOTS).map((slot, index) => {
    const running = slot === summary.current;
    const heading = running ? "Now" : index === (firstRunning ? 1 : 0) ? "Up next" : "Then";
    const names = slot.signups.map((signup) => {
      const present = summary.checkedInIds.has(Number(signup.player_id));
      // Staff can check in someone who is scheduled for the running hour but
      // has not checked in themselves.
      const staffCheckIn =
        running && !present && board.can_manage_attendance && signup.player_id && !signup.is_me
          ? button("staff-in", "check in", {
              data: { player: signup.player_id },
              title: `Check ${playerName(signup)} in`,
            })
          : "";
      return (
        `<span class="nfh-cw-person${present ? " is-present" : ""}${signup.is_me ? " is-me" : ""}"` +
        ` title="${present ? "Checked in" : "Not checked in"}">` +
        playerLink(signup) +
        (signup.paid ? "" : ' <span class="nfh-cw-muted">(unpaid)</span>') +
        staffCheckIn +
        "</span>"
      );
    });
    return (
      `<div class="nfh-cw-roster-row${running ? " is-now" : ""}">` +
      `<span class="nfh-cw-roster-when">${heading}</span>` +
      `<span class="nfh-cw-roster-time">${slotLabel(slotStart(slot))}</span>` +
      `<span class="nfh-cw-people">${names.length ? names.join("") : '<span class="nfh-cw-need">nobody signed up</span>'}</span>` +
      "</div>"
    );
  });
  return rows.join("");
}

function checkinSection(summary, board, ui, now) {
  const rows = summary.checkins.map((checkin) => {
    const staffOut =
      board.can_manage_attendance && !checkin.is_me
        ? button("staff-out", "check out", {
            data: { player: checkin.player_id },
            title: `Check ${playerName(checkin)} out`,
          })
        : "";
    return (
      `<span class="nfh-cw-person is-present${checkin.is_me ? " is-me" : ""}">` +
      playerLink(checkin) +
      ` <span class="nfh-cw-tag nfh-cw-tag--${escapeHtml(checkin.status)}">${escapeHtml(CHECKIN_STATUS[checkin.status] || checkin.status)}</span>` +
      ` <span class="nfh-cw-muted">${duration(now - Date.parse(checkin.checked_in_at))}</span>` +
      staffOut +
      "</span>"
    );
  });

  let staff = "";
  if (board.can_manage_attendance) {
    let results = "";
    if (ui.searchLoading) {
      results = '<div class="nfh-cw-muted">Searching…</div>';
    } else if (ui.searchResults) {
      results = ui.searchResults.length
        ? ui.searchResults
            .map(
              (member) =>
                `<span class="nfh-cw-person${member.checked_in ? " is-present" : ""}">` +
                playerLink(member) +
                ` <span class="nfh-cw-muted">[${escapeHtml(member.player_id)}]</span>` +
                button(
                  member.checked_in ? "staff-out" : "staff-in",
                  member.checked_in ? "check out" : "check in",
                  { data: { player: member.player_id } },
                ) +
                "</span>",
            )
            .join("")
        : '<div class="nfh-cw-muted">No member of this faction matches.</div>';
    }
    staff =
      '<div class="nfh-cw-staff">' +
      `<input type="text" class="nfh-cw-input nfh-cw-search" data-role="member-search" maxlength="50"` +
      ` placeholder="Staff: check a member in or out (name or ID)" value="${escapeHtml(ui.searchQuery)}">` +
      `<div class="nfh-cw-people">${results}</div>` +
      "</div>";
  }

  return (
    `<div class="nfh-cw-people">${rows.length ? rows.join("") : '<span class="nfh-cw-muted">Nobody is checked in right now.</span>'}</div>` +
    staff
  );
}

function slotFill(slot) {
  if (slot.total_count === 0) return "empty";
  return slot.paid_count < slot.cap ? "short" : "full";
}

function slotDetail(slot, busy) {
  const start = slotStart(slot);
  const isMine = slot.signups.some((signup) => signup.is_me);
  const waitlist = slot.total_count - slot.paid_count;
  const names = slot.signups
    .map(
      (signup) =>
        `<span class="nfh-cw-person nfh-cw-person--plain${signup.is_me ? " is-me" : ""}">${playerLink(signup)}${signup.paid ? "" : ' <span class="nfh-cw-muted">(unpaid)</span>'}</span>`,
    )
    .join("");
  const unpaidWarning =
    !isMine && slot.paid_count >= slot.cap
      ? '<span class="nfh-cw-need">Paid spots are full: you would be unpaid unless staff approve it.</span>'
      : "";

  return (
    '<div class="nfh-cw-detail">' +
    `<div><strong>${slotLabel(start)}–${hourLabel(start + HOUR_MS)} TCT</strong>` +
    ` <span class="nfh-cw-muted">(${escapeHtml(localTime(start))} your time)</span>` +
    ` · ${escapeHtml(slot.rate)} xanax/hr${slot.is_premium ? " ★" : ""}` +
    (slot.range_label ? ` · ${escapeHtml(slot.range_label)}` : "") +
    ` · ${escapeHtml(slot.paid_count)}/${escapeHtml(slot.cap)} paid` +
    (waitlist > 0 ? ` (+${waitlist} unpaid)` : "") +
    "</div>" +
    `<div class="nfh-cw-people">${names || '<span class="nfh-cw-muted">Nobody signed up yet.</span>'}</div>` +
    `<div class="nfh-cw-detail-actions${busy ? " is-busy" : ""}">` +
    (isMine
      ? button("leave", "Leave this slot", { data: { slot: slot.slot_start_iso } })
      : button("signup", "Sign up", { primary: true, data: { slot: slot.slot_start_iso } })) +
    unpaidWarning +
    "</div></div>"
  );
}

function slotsSection(summary, ui, busy) {
  const { slots } = summary;
  if (slots.length === 0) return "";

  const days = [];
  for (const slot of slots) {
    const label = dayLabel(slotStart(slot));
    if (!days.length || days[days.length - 1].label !== label) {
      days.push({ label, slots: [] });
    }
    days[days.length - 1].slots.push(slot);
  }

  const grid = days
    .map(
      (day) =>
        `<div class="nfh-cw-day"><span class="nfh-cw-day-label">${day.label}</span><div class="nfh-cw-grid">` +
        day.slots
          .map((slot) => {
            const isMine = summary.mine.includes(slot);
            const classes = [
              "nfh-cw-slot",
              `nfh-cw-slot--${slotFill(slot)}`,
              isMine ? "is-mine" : "",
              slot === summary.current ? "is-now" : "",
              ui.selectedSlot === slot.slot_start_iso ? "is-selected" : "",
            ];
            const tip =
              `${slotLabel(slotStart(slot))} TCT · ${slot.rate} xanax/hr · ` +
              `${slot.paid_count}/${slot.cap} paid${isMine ? " · you are signed up" : ""}`;
            return (
              `<button type="button" class="${classes.filter(Boolean).join(" ")}" data-action="slot"` +
              ` data-slot="${escapeHtml(slot.slot_start_iso)}" title="${escapeHtml(tip)}">` +
              `<span class="nfh-cw-slot-hour">${pad(new Date(slotStart(slot)).getUTCHours())}${slot.is_premium ? "★" : ""}</span>` +
              `<span class="nfh-cw-slot-fill">${escapeHtml(slot.paid_count)}/${escapeHtml(slot.cap)}</span>` +
              "</button>"
            );
          })
          .join("") +
        "</div></div>",
    )
    .join("");

  const selected = slots.find((slot) => slot.slot_start_iso === ui.selectedSlot);
  const mine = summary.mine.length
    ? `Your slots: ${summary.mine.map((slot) => slotLabel(slotStart(slot))).join(", ")}`
    : "Pick an hour to see who is on it and sign up.";

  return (
    `<div class="nfh-cw-muted nfh-cw-mine">${mine}</div>` +
    grid +
    (selected ? slotDetail(selected, busy) : "")
  );
}

function section(title, body) {
  return `<div class="nfh-cw-section"><div class="nfh-cw-heading">${title}</div>${body}</div>`;
}

// The expanded panel.
export function renderPanel({ board, prefs, ui, busy, now }) {
  const summary = summarize(board, now);
  const pay = `${escapeHtml(board.default_rate)} xanax/hr · ${escapeHtml(board.default_slot_cap)} paid per slot`;

  return (
    section("On watch", rosterSection(summary, board, now)) +
    section(`Checked in (${summary.checkins.length})`, checkinSection(summary, board, ui, now)) +
    section(
      `Slots <span class="nfh-cw-muted">TCT · ${pay} · ★ pays more</span>`,
      slotsSection(summary, ui, busy),
    ) +
    '<div class="nfh-cw-footer">' +
    `<label title="Applies to slots you sign up for from here"><input type="checkbox" data-pref="dmReminder"${prefs.dmReminder ? " checked" : ""}> Discord DM reminder before my slots</label>` +
    button("test-dm", "Test DM", { title: "Send yourself a test reminder on Discord" }) +
    button("refresh", "Refresh") +
    (/^https?:\/\//.test(board.signup_url || "")
      ? `<a class="nfh-cw-link" href="${escapeHtml(board.signup_url)}" target="_blank" rel="noopener">Open on nuke.family</a>`
      : "") +
    "</div>"
  );
}

// What each alert mode means for the person choosing it.
const ALERT_MODE_HELP = {
  [AlertMode.Always]:
    "You are alerted whenever your faction has an active chain in Torn and its timer gets low, whether or not a chain watch exists on nuke.family.",
  [AlertMode.Watch]:
    "You are alerted only when both are true: your faction has an active chain in Torn, and it has a chain watch set up on nuke.family. Other chains never alert.",
  [AlertMode.CheckedIn]:
    "You are alerted only when all three are true: your faction has an active chain in Torn, it has a chain watch set up on nuke.family, and you are checked in to it.",
  [AlertMode.Off]: "You are never alerted about the chain timer.",
};

// Chain timer alert settings.
export function renderSettings({ prefs, legacyScript }) {
  const option = (value, label, current) =>
    `<option value="${value}"${value === current ? " selected" : ""}>${label}</option>`;

  return (
    '<div class="nfh-cw-settings-row">' +
    `<label>Chain timer alert <select data-pref="alertMode">` +
    option(AlertMode.Always, "Any active chain", prefs.alertMode) +
    option(AlertMode.Watch, "Only chains with a chain watch", prefs.alertMode) +
    option(AlertMode.CheckedIn, "Only while I'm checked in", prefs.alertMode) +
    option(AlertMode.Off, "Off", prefs.alertMode) +
    "</select></label>" +
    `<label>Alert below <input type="text" class="nfh-cw-input nfh-cw-time" data-pref="alertSeconds" value="${formatAlertTime(prefs.alertSeconds)}" maxlength="4" title="m:ss, up to 4:59"></label>` +
    `<label>Pace <select data-pref="pace">` +
    option("fast", "Fast", prefs.pace) +
    option("normal", "Normal", prefs.pace) +
    option("slow", "Slow", prefs.pace) +
    "</select></label>" +
    `<label>Colour <input type="color" data-pref="color" value="${escapeHtml(prefs.color)}"></label>` +
    `<label>Strength <input type="range" data-pref="opacity" min="5" max="100" value="${Math.round(prefs.opacity * 100)}"></label>` +
    `<label><input type="checkbox" data-pref="beep"${prefs.beep ? " checked" : ""}> Beep</label>` +
    `<label>Volume <input type="range" data-pref="volume" min="1" max="100" value="${Math.round(prefs.volume * 100)}"></label>` +
    button("test-alert", "Test", { title: "Preview the alert for a few seconds" }) +
    `<label title="On territory war walls: strike through your own members and highlight enemies"><input type="checkbox" data-pref="markWall"${prefs.markWall ? " checked" : ""}> Mark wall targets</label>` +
    "</div>" +
    `<div class="nfh-cw-muted nfh-cw-help">${ALERT_MODE_HELP[prefs.alertMode]}` +
    (prefs.alertMode === AlertMode.Off
      ? ""
      : ` Chains of ${MIN_CHAIN_HITS} hits or fewer never alert.`) +
    "</div>" +
    (legacyScript
      ? '<div class="nfh-cw-need">The old "Chain watcher" script is still running. This replaces it, so you can remove it (otherwise both will alert).</div>'
      : "")
  );
}
