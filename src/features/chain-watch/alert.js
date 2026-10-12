import { getPrefs, PACES } from "./prefs.js";

// Chain timer alert: flash the page (and optionally beep) while the faction's
// chain is active and its timer is below the user's threshold. Replaces the
// old standalone "Chain watcher" userscript.

const FLASH_ID = "nfh-chain-flash";
const BEEP_MS = 400;
const BEEP_HZ = 440;
// A chain has to reach this many hits before its timer is worth an alert:
// the first hits of a chain are thrown away all the time and nobody is
// watching them.
export const MIN_CHAIN_HITS = 25;

// Read Torn's chain box on the faction page. Returns null when there is no
// chain box, else { active, seconds, hits } where seconds and hits are null
// if unreadable.
export function readChainTimer() {
  const box = document.querySelector(".chain-box");
  if (!box) return null;

  const title = box.querySelector(".chain-box-title");
  const timeLeft = box.querySelector(".chain-box-timeleft");
  const count = box.querySelector(".chain-box-center-stat");
  const match = timeLeft && timeLeft.textContent.trim().match(/^(\d+):(\d{2})$/);
  // "1,234" -> 1234
  const hits = count ? count.textContent.replace(/[,\s]/g, "") : "";

  return {
    active: !!title && title.textContent.trim().toLowerCase() === "chain active",
    seconds: match ? Number(match[1]) * 60 + Number(match[2]) : null,
    hits: /^\d+$/.test(hits) ? Number(hits) : null,
  };
}

function hexToRgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

// The flash is a fixed, click-through overlay animated in CSS, so it costs no
// script time per blink and never touches Torn's own elements.
function setFlashing(on) {
  let flash = document.getElementById(FLASH_ID);
  if (!on) {
    if (flash) flash.remove();
    return;
  }

  const prefs = getPrefs();
  if (!flash) {
    flash = document.createElement("div");
    flash.id = FLASH_ID;
    document.body.appendChild(flash);
  }
  flash.style.backgroundColor = hexToRgba(prefs.color, prefs.opacity);
  flash.style.animationDuration = `${PACES[prefs.pace]}ms`;
}

let audioContext = null;
let lastBeepAt = 0;

// Browsers only allow sound after the user has interacted with the page;
// until then resume() is a no-op and the beep is silently skipped.
function beep(volume) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = BEEP_HZ;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + BEEP_MS / 1000);
  } catch (e) {
    // No audio available: the visual alert still works.
  }
}

// Run once a second with the current readChainTimer() result. `armed` is
// whether the alert should react to the chain timer right now; `test` forces
// the alert on (the settings "Test" button). Returns whether the chain is low.
export function updateAlert({ timer, armed, test = false }) {
  const prefs = getPrefs();
  const low =
    armed &&
    !!timer &&
    timer.active &&
    // An unreadable hit count must not silence the alert.
    (timer.hits === null || timer.hits >= MIN_CHAIN_HITS) &&
    timer.seconds !== null &&
    timer.seconds > 0 &&
    timer.seconds < prefs.alertSeconds;

  const alerting = low || test;
  setFlashing(alerting);

  if (alerting && prefs.beep) {
    const now = Date.now();
    // Small tolerance so a 1s pace is not skipped by timer jitter.
    if (now - lastBeepAt >= PACES[prefs.pace] - 100) {
      lastBeepAt = now;
      beep(prefs.volume);
    }
  }

  return low;
}

export function stopAlert() {
  setFlashing(false);
}
