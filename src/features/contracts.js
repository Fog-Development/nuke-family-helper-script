import { api } from "../core/api.js";
import { escapeHtml, waitForElm } from "../core/dom.js";
import { LogInfo } from "../core/log.js";
import { IsPage, PageType } from "../core/pages.js";
import { createSyncedStore } from "../core/synced-store.js";
import { parseApiUtcDate } from "../core/time.js";
import { getFactionId, getPlayerId } from "../core/torn-page.js";

// Who is covered by an active contract. Each entry names a faction and/or a
// list of players; the site decides the shape, so new kinds of coverage
// (player or group contracts) work without a script update. New storage key:
// the old "contractsList" cache held a different shape.
export const contractsStore = createSyncedStore({
  storageKey: "contractCoverage",
  dataField: "coverage",
  emptyValue: [],
  serverField: "contract_cache_last_update",
  fallbackTtlMs: 6 * 60 * 60 * 1000, // 6 hours
  fetcher: async () => (await api("/contracts/active-coverage")).coverage || [],
});

// Insert the section (again) whenever fresh contract data arrives; the
// insertion is a no-op off profile pages or when the section already exists.
contractsStore.onUpdate = () => maybeInsertActiveContract();

// Find the active contract (if any) covering a player, who may have no
// faction. A coverage entry with a faction_id only covers that faction's
// members; one with player_ids only covers those players. API dates are UTC
// "YYYY-MM-DD HH:MM:SS" strings.
export function findActiveContract(factionId, playerId) {
  const coverage = contractsStore.data;
  if (!Array.isArray(coverage) || coverage.length === 0) {
    return null;
  }

  const now = new Date();

  const match = coverage.find((entry) => {
    const contract = entry.contract || {};

    const factionMatches =
      entry.faction_id == null || (factionId && entry.faction_id == factionId);

    const playerMatches =
      !Array.isArray(entry.player_ids) ||
      entry.player_ids.some((id) => String(id) === String(playerId));

    const startDate = parseApiUtcDate(contract.contract_start_date);
    const endDate = parseApiUtcDate(contract.contract_end_date);
    const dateValid = startDate <= now && (!endDate || endDate > now);

    return factionMatches && playerMatches && dateValid;
  });

  return match ? match.contract : null;
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
    const activeContract = findActiveContract(getFactionId(), getPlayerId());
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

  // A contract can pay revives under several rules at once (e.g. auto at
  // 50%+, or requested at any chance); then list the rules instead of the
  // single rule's details.
  const rules = Array.isArray(contract.rules) ? contract.rules : [];
  const items =
    rules.length > 1
      ? rules.map((rule, index) => [`Rule ${index + 1}`, rule])
      : [
          [
            "Minimum Revive Chance",
            `${contract.rule_revive_chance_percentage}%`,
          ],
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
        ];

  items.push(
    ["Premium Contract", contract.is_premium ? "Yes" : "No"],
    [
      "Start Date",
      parseApiUtcDate(contract.contract_start_date).toLocaleString(),
    ],
  );

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
