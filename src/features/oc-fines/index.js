import { api } from "../../core/api.js";
import { getApiToken } from "../../core/auth.js";
import { escapeHtml, waitForElm } from "../../core/dom.js";
import { IsPage, PageType } from "../../core/pages.js";
import { getFactionId, getPlayerId, getUserscriptUsersPlayerId } from "../../core/torn-page.js";
import { getOwnPermissions } from "../../core/user.js";
import { ocConfigStore } from "../organized-crimes/data.js";
import { openFineForm } from "./form.js";
import { bannerText } from "./logic.js";

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

// Whether the viewer may fine the profile being viewed: they hold the
// permission and the profile is in their own faction (as far as the script
// knows; the site has the last word when the form loads).
async function canFineProfile() {
  const permissions = await getOwnPermissions();
  if (!permissions.includes(FINE_PERMISSION)) return false;
  const profileFaction = getFactionId();
  if (!profileFaction) return false;
  const own = ocConfigStore.data && ocConfigStore.data.faction_id;
  return !own || String(own) === String(profileFaction);
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
  modal.innerHTML = `<div class="nfh-ocf-modal__head"><strong>Give OC fine</strong><button type="button" aria-label="Close">✕</button></div><div class="nfh-ocf-modal__body"></div>`;
  modal.querySelector(".nfh-ocf-modal__head button").addEventListener("click", () => modal.remove());
  document.body.appendChild(modal);

  openFineForm(modal.querySelector(".nfh-ocf-modal__body"), { ...opts, onClose: () => modal.remove() });
}
