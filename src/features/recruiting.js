import { api } from "../core/api.js";
import { escapeHtml } from "../core/dom.js";
import { LogInfo } from "../core/log.js";
import { getOwnPermissions } from "../core/user.js";

const RECRUITING_PERMISSION = "recruiting.predict";

// Fetch a player's ML recruiting score. Deliberately NOT cached client-side:
// every click is an intentional check that the server logs for audit, and the
// server already caches the underlying computation so re-checks stay cheap.
async function getRecruitingScoreForPlayer(playerId) {
  try {
    return await api("/candidate-score/" + playerId);
  } catch (error) {
    if (error instanceof SyntaxError) {
      // 2xx response with a malformed JSON body
      throw new Error("Bad response from server.");
    }
    if (error.name === "ApiError") {
      if (error.status === 403) {
        throw new Error("You don't have permission to use recruiting scores.");
      }
      if (error.body && error.body.error) {
        throw new Error(error.body.error);
      }
      throw new Error("Failed to fetch recruiting score.");
    }
    throw new Error("Network error fetching recruiting score.");
  }
}

// Traffic-light colour for a 0–100 sub-score (high = good).
function recruitingScoreColor(score) {
  if (score === null || score === undefined || isNaN(score)) return "#999";
  if (score >= 67) return "#3a3";
  if (score >= 34) return "#c90";
  return "#d33";
}

// Render the recruiting score + per-sub-score drivers into a container.
function renderRecruitingScore(container, data) {
  const subs = [
    ["Activity", data.activity, "activity"],
    ["Kick Safety", data.kick_safety, "kick_safety"],
    ["Retention", data.retention, "retention"],
    ["Combat", data.combat, "combat"],
  ];
  const explanation = data.explanation || {};

  // One compact, tinted line of up to 3 drivers (green = pushed the score up,
  // red = pushed it down). Each label tooltips its raw feature value. The API
  // already returns up to 3 of each per sub-score, so we just render them all.
  function driverLine(items, marker, color) {
    if (!items || !items.length) return "";
    const parts = items.slice(0, 3).map(function (d) {
      const tip =
        d.value === null || d.value === undefined
          ? d.label
          : `${d.label} = ${d.value}`;
      return `<span title="${escapeHtml(tip)}">${escapeHtml(d.label)}</span>`;
    });
    return `<div style="color:${color};margin-top:1px;">${marker} ${parts.join(" · ")}</div>`;
  }

  let html =
    `<div style="margin-top:8px;font-weight:bold;">Recruiting Score: ` +
    `<span style="color:${recruitingScoreColor(data.composite)};">${escapeHtml(data.composite)}</span>/100</div>`;

  if (data.feature_set === "public") {
    html += `<div style="font-size:11px;opacity:0.7;">Public model (battle stats not available)</div>`;
  }

  html += `<ul class="nfh-section-list" style="margin-top:6px;">`;
  subs.forEach(function (entry) {
    const name = entry[0];
    const val = entry[1];
    const drivers = explanation[entry[2]] || {};
    const lines =
      driverLine(drivers.up, "▲", "#3a3") +
      driverLine(drivers.down, "▼", "#d33");
    html +=
      `<li><span class="nfh-list-key">${name}:</span>` +
      `<span class="nfh-list-value"><strong style="color:${recruitingScoreColor(val)};">${escapeHtml(val)}</strong>` +
      (lines
        ? `<div style="font-size:11px;line-height:1.5;margin-top:3px;">${lines}</div>`
        : "") +
      `</span></li>`;
  });
  html += `</ul>`;

  container.innerHTML = html;
}

// If the user holds the recruiting permission, add a "Check Recruiting Score"
// button below the reputation list that fetches and renders the score in place.
export async function maybeAddRecruitingButton(container, playerId) {
  const permissions = await getOwnPermissions();
  if (!permissions.includes(RECRUITING_PERMISSION)) return;
  if (container.querySelector(".nfh-recruiting-wrap")) return;

  const wrap = document.createElement("div");
  wrap.classList.add("nfh-recruiting-wrap");
  wrap.style.marginTop = "8px";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("nfh-recruiting-btn");
  btn.innerText = "Check Recruiting Score";
  btn.style.cssText =
    "cursor:pointer;width:100%;padding:5px 8px;border-radius:5px;border:1px solid var(--nfh-border, #444);background:var(--nfh-bg, #2b2b2b);color:inherit;";

  const result = document.createElement("div");
  result.classList.add("nfh-recruiting-result");

  btn.addEventListener("click", async function () {
    btn.disabled = true;
    btn.innerText = "Checking…";
    try {
      const data = await getRecruitingScoreForPlayer(playerId);
      wrap.removeChild(btn);
      renderRecruitingScore(result, data);
      LogInfo(`Recruiting score for player ${playerId}: ${data.composite}`);
    } catch (error) {
      btn.disabled = false;
      btn.innerText = "Check Recruiting Score";
      result.innerHTML = `<div style="color:#d33;margin-top:6px;font-size:12px;">${escapeHtml(error.message)}</div>`;
    }
  });

  wrap.appendChild(btn);
  wrap.appendChild(result);
  container.appendChild(wrap);
}
