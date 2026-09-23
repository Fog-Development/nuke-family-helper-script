import { waitForElm } from "../core/dom.js";
import { LogInfo } from "../core/log.js";
import { PageType } from "../core/pages.js";
import { SettingsManager } from "../core/settings.js";
import { contractsStore, findActiveContract } from "./contracts.js";
import { shitlistStore } from "./shitlist/data.js";

// Colour-codes hospital rows: teal for players under an active revive
// contract, green for friendly factions, red for shitlisted players/factions.

// Extract player ID and faction ID from a hospital row <li>.
function getPlayerAndFactionFromHospitalRow(li) {
  let playerId = null;
  let factionId = null;

  try {
    // <a class="user name" href="/profiles.php?XID=XXXXX">
    const playerLink = li.querySelector('a.user.name[href*="profiles.php"]');
    if (playerLink && playerLink.href) {
      const playerMatch = playerLink.href.match(/XID=(\d+)/);
      if (playerMatch) {
        playerId = playerMatch[1];
      }
    }

    // <a class="user faction" href="/factions.php?step=profile&ID=XXXXX">
    const factionLink = li.querySelector('a.user.faction[href*="factions.php"]');
    if (factionLink && factionLink.href) {
      const factionMatch = factionLink.href.match(/ID=(\d+)/);
      if (factionMatch) {
        factionId = factionMatch[1];
      }
    }
  } catch (error) {
    LogInfo("Error parsing hospital row: " + error.message);
  }

  return { playerId, factionId };
}

// Returns 'friendly', 'shitlist', or null for a player/faction.
function checkShitlistStatus(playerId, factionId) {
  const shitListEntries = shitlistStore.data;
  if (!shitListEntries) {
    return null;
  }

  // Check faction-level entries first (if faction exists)
  if (factionId) {
    for (const key in shitListEntries) {
      if (key.startsWith("f" + factionId + "#")) {
        const entry = shitListEntries[key];

        // Respect category visibility settings
        if (
          SettingsManager.isCategoryVisible(
            entry.shitListCategoryId,
            entry.isFactionBan,
          )
        ) {
          if (entry.shitListCategory && entry.shitListCategory.is_friendly) {
            return "friendly";
          } else {
            return "shitlist";
          }
        }
      }
    }
  }

  // Check player-level entries (player bans are never friendly)
  if (playerId) {
    for (const key in shitListEntries) {
      if (key.startsWith("p" + playerId + "#")) {
        const entry = shitListEntries[key];

        if (
          SettingsManager.isCategoryVisible(
            entry.shitListCategoryId,
            entry.isFactionBan,
          )
        ) {
          return "shitlist";
        }
      }
    }
  }

  return null;
}

function applyHospitalRowColor(li, status) {
  li.classList.remove(
    "nfh-hospital-contract",
    "nfh-hospital-friendly",
    "nfh-hospital-shitlist",
  );

  if (status === "contract") {
    li.classList.add("nfh-hospital-contract");
  } else if (status === "friendly") {
    li.classList.add("nfh-hospital-friendly");
  } else if (status === "shitlist") {
    li.classList.add("nfh-hospital-shitlist");
  }
}

function processHospitalRows() {
  LogInfo("Processing hospital rows...");

  if (!contractsStore.data.length && !Object.keys(shitlistStore.data).length) {
    LogInfo("No contracts or shitlist data available");
    return;
  }

  const userInfoList = document.querySelector(".user-info-list-wrap");
  if (!userInfoList) {
    LogInfo("Hospital list not found");
    return;
  }

  const listItems = userInfoList.querySelectorAll("li");
  LogInfo(`Found ${listItems.length} hospital rows`);

  listItems.forEach((li) => {
    // Skip if already processed
    if (li.classList.contains("nfh-hospital-processed")) {
      return;
    }

    const { playerId, factionId } = getPlayerAndFactionFromHospitalRow(li);

    if (!playerId) {
      LogInfo("Could not extract player ID from row");
      return;
    }

    LogInfo(`Processing player ${playerId}, faction ${factionId || "none"}`);

    // Priority 1: active contract (highest priority)
    if (findActiveContract(factionId, playerId)) {
      LogInfo(`Player ${playerId} has active contract - applying teal`);
      applyHospitalRowColor(li, "contract");
      li.classList.add("nfh-hospital-processed");
      return;
    }

    // Priority 2 & 3: shitlist (friendly or regular)
    const shitlistStatus = checkShitlistStatus(playerId, factionId);
    if (shitlistStatus) {
      LogInfo(`Player ${playerId} has shitlist status: ${shitlistStatus}`);
      applyHospitalRowColor(li, shitlistStatus);
      li.classList.add("nfh-hospital-processed");
      return;
    }

    // Mark as processed even if no status found
    li.classList.add("nfh-hospital-processed");
  });
}

let isHospitalObserverSetup = false;

function init() {
  if (isHospitalObserverSetup) return;
  isHospitalObserverSetup = true;
  LogInfo("Setting up hospital observer...");

  waitForElm(".user-info-list-wrap").then((userInfoList) => {
    LogInfo("Hospital list found, processing initial rows...");

    processHospitalRows();

    // Reprocess when Torn swaps in new rows (pagination, auto-refresh)
    const observer = new MutationObserver(() => {
      LogInfo("Hospital list changed, reprocessing rows...");
      processHospitalRows();
    });

    observer.observe(userInfoList, {
      childList: true,
      subtree: true,
    });

    LogInfo("Hospital observer active");
  });
}

export default {
  name: "hospital",
  pages: [PageType.Hospital],
  init,
};
