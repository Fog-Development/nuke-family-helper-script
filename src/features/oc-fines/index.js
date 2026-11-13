import { api } from "../../core/api.js";
import { getApiToken } from "../../core/auth.js";
import { escapeHtml, waitForElm } from "../../core/dom.js";
import { IsPage, PageType } from "../../core/pages.js";
import { getItem, setItem } from "../../core/storage.js";
import { getFactionId, getPlayerId, getUserscriptUsersPlayerId } from "../../core/torn-page.js";
import { getOwnPermissions } from "../../core/user.js";
import { ocConfigStore } from "../organized-crimes/data.js";
import { openFineForm } from "./form.js";
import { bannerText, clampPanel, PANEL_MARGIN, panelPosition } from "./logic.js";

// OC fines in the script (docs/oc-fines-plan.md in the site's repository):
// - a box under the Nuke Family Reputation box on a faction member's profile,
//   for staff who may give fines ("OC Fines" with a "Give OC fine" button);
// - a banner on your own faction's pages while you have an unpaid fine, which
//   can be hidden for the session.

export const FINE_PERMISSION = "oc_fine.issue";

const BOX_CLASS = "nfh-ocf-box";
const BANNER_ID = "nfh-ocf-banner";
const MINE_CACHE_KEY = "nfhOcFinesMine";
const MINE_TTL_MS = 30 * 60 * 1000;
const BANNER_HIDDEN_KEY = "nfhOcFinesBannerHidden";

const PROFILE_FACTION_LINK = ".basic-information .info-table a[href^='/factions.php?step=profile&ID=']";
const PROFILE_INFO = ".basic-information .info-table li";
const PROFILE_WAIT_MS = 15 * 1000;

// Resolves with the element, or null when it has not appeared in time.
function waitBriefly(selector, ms = PROFILE_WAIT_MS) {
  return Promise.race([waitForElm(selector), new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
}

// The faction the viewed profile shows, once Torn has drawn the profile's
// info (it arrives after the page loads); null for a factionless player.
async function profileFaction() {
  if (!(await waitBriefly(PROFILE_INFO))) return null;
  // The info rows come together; give the faction link a moment to follow.
  const link = await waitBriefly(PROFILE_FACTION_LINK, 2000);
  return link ? getFactionId() : null;
}

// The viewer's own faction, from the OC config nuke.family sends.
async function ownFaction() {
  if (!(ocConfigStore.data && ocConfigStore.data.faction_id)) await ocConfigStore.refresh();
  return (ocConfigStore.data && ocConfigStore.data.faction_id) || null;
}

// Whether the viewer may fine the profile being viewed: they hold the
// permission and the profile is in their own faction. Without both factions
// known there is no box (the site still has the last word on issuing).
async function canFineProfile() {
  const permissions = await getOwnPermissions();
  if (!permissions.includes(FINE_PERMISSION)) return false;
  const [theirs, own] = await Promise.all([profileFaction(), ownFaction()]);
  return Boolean(theirs && own) && String(own) === String(theirs);
}

async function insertProfileBox() {
  if (!IsPage(PageType.Profile) || !getApiToken()) return;
  const playerId = getPlayerId();
  if (!playerId || String(playerId) === String(getUserscriptUsersPlayerId())) return;
  if (document.querySelector(`.${BOX_CLASS}`)) return;
  if (!(await canFineProfile())) return;

  const wrapper = await waitForElm("div.profile-left-wrapper");
  if (document.querySelector(`.${BOX_CLASS}`)) return;

  const box = document.createElement("div");
  box.className = `${BOX_CLASS} nfh-section m-top10`;
  box.innerHTML = `<div>
    <p class="nfh-section-title title-black top-round">OC Fines</p>
    <div class="nfh-section-container">
      <button type="button" class="nfh-ocf-open">Give OC fine</button>
      <div class="nfh-ocf-slot"></div>
    </div>
  </div>`;

  const openButton = box.querySelector(".nfh-ocf-open");
  const slot = box.querySelector(".nfh-ocf-slot");
  openButton.addEventListener("click", () => {
    openButton.hidden = true;
    openFineForm(slot, {
      playerId,
      onClose: () => {
        openButton.hidden = false;
      },
    });
  });

  // Below the reputation box when it is there, else where it would be.
  const reputation = document.querySelector(".nfh-reputation");
  if (reputation) {
    reputation.insertAdjacentElement("afterend", box);
  } else if (wrapper.firstChild && wrapper.firstChild.nextSibling) {
    wrapper.insertBefore(box, wrapper.firstChild.nextSibling);
  } else {
    wrapper.appendChild(box);
  }
}

async function loadMine() {
  try {
    const cached = JSON.parse(localStorage.getItem(MINE_CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < MINE_TTL_MS) return cached.data;
  } catch (e) {
    // fetch again
  }
  try {
    const data = await api("/oc-fines/mine");
    localStorage.setItem(MINE_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
    return data;
  } catch (error) {
    // A site without OC fines, or a member not connected: show nothing.
    return null;
  }
}

async function showBanner() {
  if (!getApiToken() || document.getElementById(BANNER_ID)) return;
  if (sessionStorage.getItem(BANNER_HIDDEN_KEY)) return;
  if (!IsPage(PageType.Faction) || !window.location.search.includes("step=your")) return;

  const mine = await loadMine();
  const text = bannerText(mine);
  if (!text || document.getElementById(BANNER_ID)) return;

  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.className = "nfh-ocf-banner";
  banner.innerHTML = `<span>⚖️ ${escapeHtml(text)}</span>
    ${mine.deposit_instructions ? `<span class="nfh-ocf-banner__how">${escapeHtml(mine.deposit_instructions)}</span>` : ""}
    <a href="${escapeHtml((mine.links && mine.links.mine) || "https://nuke.family/my-oc-fines")}" target="_blank" rel="noopener">My OC fines</a>
    <button type="button" aria-label="Hide until next session">✕</button>`;
  banner.querySelector("button").addEventListener("click", () => {
    sessionStorage.setItem(BANNER_HIDDEN_KEY, "1");
    banner.remove();
  });

  const anchor = document.querySelector(".content-wrapper") || document.querySelector("#mainContainer");
  if (anchor) anchor.insertAdjacentElement("afterbegin", banner);
}

function init() {
  insertProfileBox();
  showBanner();
}

export default {
  name: "oc-fines",
  pages: [PageType.Profile, PageType.Faction],
  init,
};

const MODAL_ID = "nfh-ocf-modal";

// The fine form in a floating panel, for pages that redraw under it (the
// crimes page re-renders a slot when its member is removed, and a fine is
// often given right after removing them).
export function openFineModal(opts) {
  document.getElementById(MODAL_ID)?.remove();

  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "nfh-ocf-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-label", "Give OC fine");
  modal.innerHTML = `<div class="nfh-ocf-modal__head" title="Drag to move · double-click to put back"><strong>Give OC fine</strong><button type="button" aria-label="Close">✕</button></div><div class="nfh-ocf-modal__body"></div>`;
  const head = modal.querySelector(".nfh-ocf-modal__head");
  const close = () => {
    window.removeEventListener("resize", onResize);
    modal.remove();
  };
  head.querySelector("button").addEventListener("click", close);
  document.body.appendChild(modal);

  // Placed where the member last left it, else the middle of the right edge
  // (Torn's chat and its open chat boxes sit bottom right).
  const sizes = () => ({ panelWidth: modal.offsetWidth, headHeight: head.offsetHeight });
  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });
  const place = (pos) => {
    if (pos) {
      modal.classList.add("nfh-ocf-modal--placed");
      modal.style.left = `${pos.left}px`;
      modal.style.top = `${pos.top}px`;
      modal.style.maxHeight = `${window.innerHeight - pos.top - PANEL_MARGIN}px`;
    } else {
      modal.classList.remove("nfh-ocf-modal--placed");
      modal.style.left = modal.style.top = modal.style.maxHeight = "";
    }
  };
  place(panelPosition(loadPanelPosition(), viewport(), sizes()));

  // A window made smaller can leave the panel off screen: put it back.
  function onResize() {
    if (!modal.classList.contains("nfh-ocf-modal--placed")) return;
    const pos = { left: parseFloat(modal.style.left), top: parseFloat(modal.style.top) };
    if (!panelPosition(pos, viewport(), sizes())) place(null);
  }
  window.addEventListener("resize", onResize);

  head.addEventListener("dblclick", (event) => {
    if (event.target.closest("button")) return;
    place(null);
    savePanelPosition(null);
  });

  head.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const rect = modal.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    let moved = null;
    head.setPointerCapture(event.pointerId);
    const onMove = (e) => {
      moved = clampPanel(e.clientX - offsetX, e.clientY - offsetY, viewport(), sizes());
      place(moved);
    };
    const onUp = () => {
      head.removeEventListener("pointermove", onMove);
      head.removeEventListener("pointerup", onUp);
      head.removeEventListener("pointercancel", onUp);
      if (moved) savePanelPosition(moved);
    };
    head.addEventListener("pointermove", onMove);
    head.addEventListener("pointerup", onUp);
    head.addEventListener("pointercancel", onUp);
    event.preventDefault();
  });

  openFineForm(modal.querySelector(".nfh-ocf-modal__body"), { ...opts, onClose: close });
}

const PANEL_KEY = "nfhOcFinePanel";

function loadPanelPosition() {
  try {
    return JSON.parse(getItem(PANEL_KEY) || "null");
  } catch {
    return null;
  }
}

function savePanelPosition(pos) {
  setItem(PANEL_KEY, pos ? JSON.stringify(pos) : null);
}
