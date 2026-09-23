import { api } from "../core/api.js";
import { escapeHtml, waitForElm } from "../core/dom.js";
import { LogInfo } from "../core/log.js";
import { IsPage, PageType } from "../core/pages.js";
import { createSyncedStore } from "../core/synced-store.js";
import { parseApiUtcDate } from "../core/time.js";
import { getFactionId, getPlayerId } from "../core/torn-page.js";

export const contractsStore = createSyncedStore({
  storageKey: "contractsList",
  dataField: "contracts",
  emptyValue: [],
  serverField: "contract_cache_last_update",
  fallbackTtlMs: 6 * 60 * 60 * 1000, // 6 hours
  fetcher: () => api("/contracts/get_contracts"),
});

// Insert the section (again) whenever fresh contract data arrives; the
// insertion is a no-op off profile pages or when the section already exists.
contractsStore.onUpdate = () => maybeInsertActiveContract();

// Find the active contract (if any) covering a player of the given faction.
// API dates are UTC "YYYY-MM-DD HH:MM:SS" strings. If a contract specifies
// focus_players, it only applies to the players in that CSV list.
export function findActiveContract(factionId, playerId) {
  const contracts = contractsStore.data;
  if (!factionId || !contracts || contracts.length === 0) {
    return null;
  }

  const now = new Date();

  return (
    contracts.find((contract) => {
      const factionMatches = contract.faction_id == factionId;

      const startDate = parseApiUtcDate(contract.contract_start_date);
      const endDate = parseApiUtcDate(contract.contract_end_date);
      const dateValid = startDate <= now && (!endDate || endDate > now);

      let playerMatches = true;
      if (contract.focus_players && contract.focus_players.trim() !== "") {
        const focusPlayerIds = contract.focus_players
          .split(",")
          .map((id) => id.trim());
        playerMatches = focusPlayerIds.includes(playerId);
      }

      return factionMatches && dateValid && playerMatches;
    }) || null
  );
}

// On a profile page: check whether the viewed player is covered by an active
// contract and, if so, insert the "Active Contract" section.
export function maybeInsertActiveContract() {
  if (!IsPage(PageType.Profile)) {
    return;
  }

  LogInfo("Waiting for faction info to load before checking contracts...");
  waitForElm(
    "div.basic-information.profile-left-wrapper.left > div > div.cont.bottom-round > div > ul",
  ).then(() => {
    LogInfo("Checking for active contract...");
    const factionId = getFactionId();
    if (!factionId) {
      return; // No faction, no contract
    }

    const activeContract = findActiveContract(factionId, getPlayerId());
    if (activeContract) {
      LogInfo("Inserting active contract section:", activeContract);
      insertActiveContractSection(activeContract);
    }
  });
}

function insertActiveContractSection(contract) {
  // Prevent duplicate insertion
  if (document.querySelector(".nfh-active-contract")) {
    return;
  }

  waitForElm("div.profile-left-wrapper").then((elm) => {
    // Double-check after waiting for element
    if (document.querySelector(".nfh-active-contract")) {
      return;
    }

    const activeContractDiv = document.createElement("div");
    activeContractDiv.classList.add(
      "nfh-active-contract",
      "nfh-section",
      "m-top10",
    );
    activeContractDiv.appendChild(document.createElement("div"));

    const activeContractTitle = document.createElement("p");
    activeContractTitle.innerText = "Active Contract";
    activeContractTitle.classList.add(
      "nfh-active-contract-title",
      "nfh-section-title",
      "title-black",
      "top-round",
    );

    const contractInfoContainer = buildContractInfoContainer(contract);

    activeContractDiv.appendChild(activeContractTitle);
    activeContractDiv.appendChild(contractInfoContainer);

    // Insert after the first child of profile-left-wrapper
    const firstChild = elm.firstChild;
    if (firstChild && firstChild.nextSibling) {
      elm.insertBefore(activeContractDiv, firstChild.nextSibling);
    } else {
      elm.appendChild(activeContractDiv);
    }
  });
}

function buildContractInfoContainer(contract) {
  const contractInfoContainer = document.createElement("div");
  contractInfoContainer.classList.add(
    "nfh-active-contract-container",
    "nfh-section-container",
  );

  const contractInfoList = document.createElement("ul");
  contractInfoList.classList.add(
    "nfh-active-contract-list",
    "nfh-section-list",
  );

  const items = [
    ["Minimum Revive Chance", `${contract.rule_revive_chance_percentage}%`],
    [
      "Player Status",
      contract.rule_player_status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    ],
    ["Online Required", contract.rule_is_online ? "Yes" : "No"],
    ["Idle Allowed", contract.rule_is_away ? "Yes" : "No"],
    ["Offline Allowed", contract.rule_is_offline ? "Yes" : "No"],
    ["Premium Contract", contract.is_premium ? "Yes" : "No"],
    ["Start Date", new Date(contract.contract_start_date).toLocaleString()],
  ];

  if (contract.note) {
    items.push(["Note", contract.note]);
  }

  for (const [key, value] of items) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="nfh-list-key">${escapeHtml(key)}:</span><span class="nfh-list-value">${escapeHtml(value)}</span>`;
    contractInfoList.appendChild(li);
  }

  contractInfoContainer.appendChild(contractInfoList);
  return contractInfoContainer;
}

export default {
  name: "contracts",
  pages: [PageType.Profile],
  init: maybeInsertActiveContract,
};
