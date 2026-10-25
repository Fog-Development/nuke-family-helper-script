import { getApiToken } from "../../core/auth.js";
import { DEBUG } from "../../core/config.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { isOwnFactionMainTab } from "../../core/torn-page.js";
import { startCapture } from "./capture.js";
import { markSent, report, sentIds } from "./data.js";
import { attacksToReport, feedFactionId } from "./logic.js";

// Retal alerts: hears Torn's chain feed on the member's own faction page and
// tells nuke.family about enemies who hit our members (and about our hits
// that Torn counted as retals), so every member can see who can still be hit
// back.
//
// Step 2 of docs/retal-alerts-plan.md (site repo): capture and report only.
// Until the list is built, reports go out from debug builds (to nuke.test)
// and from a release build only where localStorage `nfhRetalsReport` is "1";
// anywhere else the feed is heard and nothing is sent.
function sendReports() {
  if (DEBUG) return true;
  try {
    return localStorage.getItem("nfhRetalsReport") === "1";
  } catch (e) {
    return false;
  }
}

const sourcesSeen = new Set();
let sending = false;
let queued = false;
let latestFeed = null;

function onFeed(feed, source, keys) {
  if (!isOwnFactionMainTab()) return;

  if (!sourcesSeen.has(source)) {
    sourcesSeen.add(source);
    LogInfo(`[retals] first chain feed from ${source}`, { answer_keys: keys, sample: feed.recentAttacks[0] });
  }

  const stealthed = feed.recentAttacks.find((attack) => Number(attack.stealthAttack) !== 0);
  if (stealthed && !sourcesSeen.has("stealth")) {
    sourcesSeen.add("stealth");
    LogInfo("[retals] a stealthed attack as Torn gives it", stealthed, feed.users[stealthed.attackerID] || null);
  }

  latestFeed = feed;
  flush();
}

async function flush() {
  if (sending) {
    queued = true;
    return;
  }
  const feed = latestFeed;
  if (!feed) return;

  const factionId = feedFactionId(feed);
  if (!factionId) {
    LogInfo("[retals] could not tell the faction from the feed", feed);
    return;
  }

  const sent = sentIds();
  const attacks = attacksToReport(feed, factionId, sent, Math.floor(Date.now() / 1000));

  // Attacks that don't matter never will, so they are dealt with now; the
  // ones being reported only once the site has them.
  const reporting = new Set(attacks.map((attack) => attack.id));
  markSent(feed.recentAttacks.filter((attack) => attack.publicID && !reporting.has(String(attack.publicID))));

  if (!attacks.length) return;

  const send = sendReports();
  LogInfo(`[retals] ${send ? "sending" : "would send"} for faction ${factionId}`, attacks);
  if (!send || !getApiToken()) {
    markSent(attacks);
    return;
  }

  sending = true;
  try {
    const answer = await report(factionId, attacks);
    markSent(attacks);
    LogInfo("[retals] site answered", answer);
  } catch (error) {
    // Left unsent, so the next feed update tries them again.
    LogInfo("[retals] report failed", error.status ?? error.kind, error.body ?? error.message);
  } finally {
    sending = false;
    if (queued) {
      queued = false;
      flush();
    }
  }
}

export default {
  name: "retals",
  pages: [PageType.Faction],
  init() {
    if (!isOwnFactionMainTab()) return;
    // Listening is all this does, so once per page load is enough: it keeps
    // working across tab switches and ignores the feed off the main tab.
    startCapture(onFeed);
  },
};
