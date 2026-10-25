import { escapeHtml } from "../../core/dom.js";
import { isPda } from "../../core/pda-polyfill.js";
import { formatLeft, noticeKey, retalsToAnnounce } from "./logic.js";
import { getPrefs } from "./prefs.js";

// One notice per new retal: a toast on the page, and optionally a single
// chime and a desktop notification. Never repeated, never an alarm: a retal
// is announced once per browser, whichever tab saw it first.

const TOAST_ID = "nfh-retal-toast";
const TOAST_MS = 12 * 1000;
const ANNOUNCED_KEY = "nfhRetalsAnnounced";
const KEEP_SECONDS = 15 * 60;

let toastTimer = null;
let audioContext = null;

function loadAnnounced() {
  try {
    return JSON.parse(localStorage.getItem(ANNOUNCED_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}

function saveAnnounced(list, nowSeconds) {
  for (const [key, at] of Object.entries(list)) if (at < nowSeconds - KEEP_SECONDS) delete list[key];
  try {
    localStorage.setItem(ANNOUNCED_KEY, JSON.stringify(list));
  } catch (e) {
    // Blocked storage: this page still only announces each once.
  }
}

// Desktop notifications, where the browser has them. TornPDA's web view does
// not, so the setting is not offered there.
export function desktopSupported() {
  return !isPda && typeof window.Notification === "function";
}

export function desktopPermission() {
  return desktopSupported() ? window.Notification.permission : "unsupported";
}

// Asked from the settings checkbox, inside the click, as browsers require.
export async function askDesktopPermission() {
  if (!desktopSupported()) return "unsupported";
  if (window.Notification.permission !== "default") return window.Notification.permission;
  try {
    return await window.Notification.requestPermission();
  } catch (e) {
    return "denied";
  }
}

// Two short rising notes. Browsers allow sound only after the member has
// interacted with the page; until then this is silently skipped.
export function chime(volume) {
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const start = audioContext.currentTime;
    [660, 880].forEach((hz, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = hz;
      const at = start + index * 0.16;
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.15);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.16);
    });
  } catch (e) {
    // No audio: the toast still shows.
  }
}

function describe(retal, nowSeconds) {
  const victim = retal.victims && retal.victims[0] ? ` hit ${retal.victims[0].name || "one of us"}` : "";
  return `${victim} · ${formatLeft(retal.expires_at - nowSeconds)} left`;
}

function hideToast() {
  const toast = document.getElementById(TOAST_ID);
  if (toast) toast.remove();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
}

// `onAttack(enemyId)` runs the list's own Attack (claim first).
function showToast(retals, nowSeconds, onAttack) {
  hideToast();
  const toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.className = "nfh-cw nfh-rt-toast";
  toast.setAttribute("role", "status");

  if (retals.length === 1) {
    const retal = retals[0];
    const tag = retal.enemy_faction_tag ? ` <span class="nfh-rt-tag">${escapeHtml(retal.enemy_faction_tag)}</span>` : "";
    toast.innerHTML = `<div class="nfh-rt-toast-text"><strong>Retal:</strong> ${escapeHtml(retal.enemy_name || `#${retal.enemy_id}`)}${tag}<span class="nfh-rt-muted">${escapeHtml(describe(retal, nowSeconds))}</span></div>
      <span class="nfh-rt-actions"><button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-toast="attack">Attack</button>
      <button type="button" class="nfh-cw-btn" data-toast="close" aria-label="Dismiss">✕</button></span>`;
  } else {
    const names = retals.map((retal) => escapeHtml(retal.enemy_name || `#${retal.enemy_id}`)).join(", ");
    toast.innerHTML = `<div class="nfh-rt-toast-text"><strong>${retals.length} new retals:</strong> ${names}</div>
      <span class="nfh-rt-actions"><button type="button" class="nfh-cw-btn" data-toast="close" aria-label="Dismiss">✕</button></span>`;
  }

  toast.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toast]");
    if (!button) return;
    if (button.dataset.toast === "attack") onAttack(retals[0].enemy_id);
    hideToast();
  });
  document.body.appendChild(toast);
  toastTimer = setTimeout(hideToast, TOAST_MS);
}

function showDesktop(retals, nowSeconds) {
  if (desktopPermission() !== "granted") return;
  try {
    const first = retals[0];
    const title = retals.length === 1 ? `Retal: ${first.enemy_name || `#${first.enemy_id}`}` : `${retals.length} new retals`;
    const body =
      retals.length === 1
        ? describe(first, nowSeconds).replace(/^ /, "")
        : retals.map((retal) => retal.enemy_name || `#${retal.enemy_id}`).join(", ");
    const notice = new window.Notification(title, { body, tag: `nfh-retal-${noticeKey(first)}` });
    notice.onclick = () => {
      window.focus();
      notice.close();
    };
  } catch (e) {
    // Some browsers only allow notifications from a service worker.
  }
}

// Announce whatever in this answer is new to this browser, once.
export function announce(retals, nowSeconds, onAttack) {
  const prefs = getPrefs();
  const announced = loadAnnounced();
  const fresh = retalsToAnnounce(retals, new Set(Object.keys(announced)), nowSeconds, prefs.minSeconds);
  if (!fresh.length) return;

  for (const retal of fresh) announced[noticeKey(retal)] = nowSeconds;
  saveAnnounced(announced, nowSeconds);
  if (!prefs.notify) return;

  showToast(fresh, nowSeconds, onAttack);
  if (prefs.sound) chime(prefs.volume);
  if (prefs.desktop) showDesktop(fresh, nowSeconds);
}

// Take back a toast for a retal that has since been done or claimed.
export function dropToast() {
  hideToast();
}
