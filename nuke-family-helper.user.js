// ==UserScript==
// @name         Nuke Assistant
// @namespace    https://nuke.family/
// @version      2.10.1
// @description  Making things easier for the Nuke Family. This application will only function properly if you are a Nuke Member who has a site API key generated from https://nuke.family/user
// @author       Fogest <nuke@jhvisser.com>
// @match        https://www.torn.com/factions.php*
// @match        https://www.torn.com/profiles.php*
// @match				 https://nuke.family/auth/token-generation*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAsVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAADAgEIBwIJCAILCQMODAQUEQUYFQcaFgcfGgggGwklIAotJgwyKg46MhA8MxBKPxRQRBZgUhthUhthUxt1ZCB9aiOEcCSIdCaQeyihiSyiiS21mjLBpDXFpzbGqDfHqTfIqjjTszrXtzzZuTzlw0DmxEDnxEDpxkHuy0LxzUNZTIHlAAAAD3RSTlMAAh4tMVtig4WRlqvq8v4ZRfBIAAABcElEQVQ4y4VT2ZKCMBBEReTSVhEX8T5BFMVb8/8ftokhJB5b2w9U9VFkMpnRNImSbpiWZRp6SfuGiu0ih2tXPuyy04CChlN+9at1vKFeVf0aVX5Um5Hai+8np470O6fEVxJVIDgQspKBFSGHAMhPKdfhU5/ce8Lv3Sk9+KjzSh0gIQwbEdg8aQI4z/s3MCEcY+6PczpBg/XDRjPLlV2L+a1dTrMmbNpfFyMisGCBRUFHcEuaDsSFsmeBfUFjQNcMIBXCOehHUT84C54ChmYCNyHM+xdCLv254DfA1Cx4xS/DiH2jsBA8WDSggAdUxWJHSPAjVMVkRaoJWuSLYLBrSnRnYTjrqorOGiWxZjWsFYE2ira6wODBAo+BVGz+WAJbfrmtHM1K/twcU3H9qVAcMTBPtI8icGzng1suRo5hWTSQLLlSVYcawVUGrgE+xhrDTAay4avPF6c5ilP6sLc0HjXfF0eunud9X73/l/fP9f8FWPxZz4MGj9YAAAAASUVORK5CYII=
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @connect      nuke.family
// @connect      github.com
// @connect 		 raw.githubusercontent.com
// ==/UserScript==

// ONLY LEAVE ACTIVE FOR DEV
const debug = false;

const DEFAULT_VERSION = "2.10.1";
const CURRENT_VERSION =
  typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version
    ? GM_info.script.version
    : DEFAULT_VERSION;
// const CURRENT_VERSION = DEFAULT_VERSION;
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const GITHUB_URL =
  "https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js";

const PageType = {
  Profile: "Profile",
  RecruitCitizens: "Recruit Citizens",
  HallOfFame: "Hall Of Fame",
  Faction: "Faction",
  Company: "Company",
  Competition: "Competition",
  Bounty: "Bounty",
  Search: "Search",
  Hospital: "Hospital",
  Chain: "Chain",
  FactionControl: "Faction Control",
  FactionControlPayday: "Faction Control Per Day",
  FactionControlApplications: "Faction Control Applications",
  Market: "Market",
  Forum: "Forum",
  ForumThread: "ForumThread",
  ForumSearch: "ForumSearch",
  Abroad: "Abroad",
  Enemies: "Enemies",
  Friends: "Friends",
  PointMarket: "Point Market",
  Properties: "Properties",
  War: "War",
  ChainReport: "ChainReport",
  RWReport: "RWReport",
  NukeFamily3rdParty: "NukeFamily3rdParty",
};

var mapPageTypeAddress = {
  [PageType.Profile]: "https://www.torn.com/profiles.php",
  [PageType.RecruitCitizens]: "https://www.torn.com/bringafriend.php",
  [PageType.HallOfFame]: "https://www.torn.com/halloffame.php",
  [PageType.Faction]: "https://www.torn.com/factions.php",
  [PageType.Company]: "https://www.torn.com/joblist.php",
  [PageType.Competition]: "https://www.torn.com/competition.php",
  [PageType.Bounty]: "https://www.torn.com/bounties.php",
  [PageType.Search]: "https://www.torn.com/page.php",
  [PageType.Hospital]: "https://www.torn.com/hospitalview.php",
  [PageType.Chain]: "https://www.torn.com/factions.php?step=your#/war/chain",
  [PageType.FactionControl]:
    "https://www.torn.com/factions.php?step=your#/tab=controls",
  [PageType.FactionControlPayday]:
    "https://www.torn.com/factions.php?step=your#/tab=controls",
  [PageType.FactionControlApplications]:
    "https://www.torn.com/factions.php?step=your#/tab=controls",
  [PageType.Market]: "https://www.torn.com/imarket.php",
  [PageType.Forum]: "https://www.torn.com/forums.php",
  [PageType.ForumThread]: "https://www.torn.com/forums.php#/p=threads",
  [PageType.ForumSearch]: "https://www.torn.com/forums.php#/p=search",
  [PageType.Abroad]: "https://www.torn.com/index.php?page=people",
  [PageType.Enemies]: "https://www.torn.com/blacklist.php",
  [PageType.Friends]: "https://www.torn.com/friendlist.php",
  [PageType.PointMarket]: "https://www.torn.com/pmarket.php",
  [PageType.Properties]: "https://www.torn.com/properties.php",
  [PageType.War]: "https://www.torn.com/war.php",
  [PageType.ChainReport]: "https://www.torn.com/war.php?step=chainreport",
  [PageType.RWReport]: "https://www.torn.com/war.php?step=rankreport",
  [PageType.NukeFamily3rdParty]: "https://nuke.family/auth/token-generation",
};

if (debug) {
  // Make PageType.NukeFamily3rdParty point to dev site
  mapPageTypeAddress[PageType.NukeFamily3rdParty] =
    "http://nuke.test/auth/token-generation";
}
console.log(mapPageTypeAddress);

var mapPageAddressEndWith = {
  [PageType.FactionControl]: "/tab=controls",
  [PageType.FactionArmouryDrug]: "tab=armoury&start=0&sub=drugs",
  [PageType.FactionControlPayday]: "tab=controls&option=pay-day",
  [PageType.FactionControlApplications]: "tab=controls&option=application",
};

const cacheLength = 720; //minutes (12 hours)
const CACHE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

let savedDataShitEntries = null;
let savedDataShitCategories = null;
let savedDataNfhUserRole = null;

let shitListEntries = null;
let shitListCategories = null;
let nfhUserRole = null;

let savedDataContracts = null;
let contracts = null;

// Settings manager for shitlist category visibility
const SettingsManager = {
  getHiddenCategories: () => {
    try {
      return JSON.parse(
        localStorage.getItem("hiddenShitlistCategories") || "[]"
      );
    } catch (e) {
      console.error("Error parsing hidden categories:", e);
      return [];
    }
  },

  setHiddenCategories: (hiddenIds) => {
    localStorage.setItem("hiddenShitlistCategories", JSON.stringify(hiddenIds));
  },

  isCategoryVisible: (categoryId, isFaction) => {
    // Faction categories are always visible
    if (isFaction) return true;

    console.log("Checking visibility for category:", categoryId, isFaction);

    console.log(
      "Is category visible?",
      !SettingsManager.getHiddenCategories().includes(String(categoryId))
    );

    // Check if category is in hidden list
    return !SettingsManager.getHiddenCategories().includes(String(categoryId));
  },

  toggleCategory: (categoryId, isVisible) => {
    const hidden = SettingsManager.getHiddenCategories();
    console.log("Hidden Categories:", hidden);
    let updated;

    if (isVisible) {
      // Remove from hidden list
      updated = hidden.filter((id) => id !== categoryId);
    } else {
      // Add to hidden list if not already there
      if (!hidden.includes(String(categoryId))) {
        updated = [...hidden, String(categoryId)];
      } else {
        updated = hidden;
      }
    }

    SettingsManager.setHiddenCategories(updated);
    return updated;
  },
};

(function () {
  ("use strict");

  // Inject styles onto page
  const styles = `
    /* Theme-aware CSS variables */
    :root {
        --nfh-bg: #1a1a1a;
        --nfh-text: #ffffff;
        --nfh-section-bg: #2a2a2a;
        --nfh-container-bg: #222;
        --nfh-btn-bg: #333;
        --nfh-btn-hover: #444;
        --nfh-border: #444;
        --nfh-list-key: #b0b0b0;
        --nfh-hidden-count: #999;
    }

    /* Light theme overrides */
    body:not(.dark-mode) {
        --nfh-bg: #f5f5f5;
        --nfh-text: #333333;
        --nfh-section-bg: #ffffff;
        --nfh-container-bg: #eaeaea;
        --nfh-btn-bg: #dddddd;
        --nfh-btn-hover: #cccccc;
        --nfh-border: #cccccc;
        --nfh-list-key: #666666;
        --nfh-hidden-count: #666666;
    }

    .nfh-section {
        margin-top: 10px;
        background-color: var(--nfh-bg);
        border-radius: 5px;
        overflow: hidden;
        font-family: 'Roboto', sans-serif;
    }

    .nfh-section-title {
        padding: 8px 12px;
        font-weight: 600;
        font-size: 14px;
        background-color: var(--nfh-section-bg);
        color: var(--nfh-text);
    }

    .nfh-section-container {
        padding: 10px 12px !important;
        background-color: var(--nfh-container-bg);
    }

    .nfh-section-list {
        list-style-type: none;
        padding-left: 0;
        margin: 0;
    }

    .nfh-section-list li {
        margin-bottom: 8px;
        padding: 8px 10px 8px 20px;
        background-color: var(--nfh-section-bg);
        border-radius: 3px;
        font-size: 13px;
        line-height: 1.4;
        color: var(--nfh-text);
        position: relative;
    }

    .nfh-shitlist-entry-profile-container {
      background-color: var(--nfh-container-bg) !important;
      border-bottom: 0px !important;
    }

    .nfh-section-list li::before {
        content: '▶';
        position: absolute;
        left: 8px;
        top: 11px;
        color: #4caf50;
        font-size: 10px;
    }

    .nfh-shitlist-profile-list li {
      margin-bottom: 8px;
        padding: 8px 10px 8px 20px;
        background-color: var(--nfh-section-bg);
        border-radius: 3px;
        font-size: 13px;
        line-height: 1.4;
        color: var(--nfh-text);
        position: relative;
    }

    .nfh-shitlist-profile-list li::before {
        content: '▶';
        position: absolute;
        left: 8px;
        top: 11px;
        color: #4caf50;
        font-size: 10px;
    }

    .nfh-list-key {
        font-weight: 600;
        color: var(--nfh-list-key);
        display: inline-block;
        width: 100px;
        vertical-align: top;
    }

    .nfh-list-value {
        display: inline-block;
        width: calc(100% - 105px);
        vertical-align: top;
    }

    .nfh-shitlist-entry-container {
        border-left: 3px solid #4caf50;
        background-color: var(--nfh-container-bg);
    }

    .nfh-extra-shitlist-entry-condition {
        font-size: 12px;
        color: #4caf50;
        margin-left: 5px;
    }

    .nfh-btn {
        background-color: var(--nfh-btn-bg);
        color: var(--nfh-text);
        border: none;
        padding: 6px 10px;
        border-radius: 3px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: 13px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 8px;
    }

    .nfh-btn:hover {
        background-color: var(--nfh-btn-hover);
    }
    
    .nfh-shitlist-entry-profile-container-friendly {
      border-right: 3px solid #4caf50;
    }

    .nfh-shitlist-entry-container-friendly {
      background-color: #00ff1466 !important;
      border-left: 0px !important;
    }

    /* Settings panel styles */
    .nfh-shitlist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
    }

    .nfh-settings-cog {
        cursor: pointer;
        color: var(--nfh-text);
        font-size: 16px;
        margin-right: 10px;
        transition: transform 0.3s ease;
    }

    .nfh-settings-cog:hover {
        color: #4caf50;
        transform: rotate(90deg);
    }

    .nfh-settings-panel {
        background-color: var(--nfh-section-bg);
        border-radius: 5px;
        padding: 15px;
        border: 1px solid var(--nfh-border);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        position: fixed;
        z-index: 9999;
        width: 250px;
        right: 20px;
        bottom: 50px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        max-width: 95vw;
        display: flex;
        flex-direction: column;
    }
    
    .nfh-shitlist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative; /* Ensure the header is a positioning context */
    }

    .nfh-settings-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--nfh-text);
        border-bottom: 1px solid var(--nfh-border);
        padding-bottom: 5px;
    }

    .nfh-category-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        padding: 5px;
        border-radius: 3px;
        transition: background-color 0.2s;
    }

    .nfh-category-item:hover {
        background-color: var(--nfh-btn-bg);
    }

    .nfh-category-item input[type="checkbox"] {
        margin-right: 8px;
    }

    .nfh-category-item.faction-locked {
        opacity: 0.8;
        pointer-events: none;
    }

    .nfh-category-item.faction-locked input[type="checkbox"] {
        cursor: not-allowed;
    }

    .nfh-hidden-count {
        font-size: 11px;
        color: var(--nfh-hidden-count);
        margin-top: 5px;
        font-style: italic;
    }

    .nfh-close-settings {
        background-color: var(--nfh-btn-bg);
        color: var(--nfh-text);
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 10px;
        transition: background-color 0.2s;
        width: 100%;
    }

    .nfh-close-settings:hover {
        background-color: var(--nfh-btn-hover);
    }
`;

  addStyle(styles);

  LogInfo("Nuke Family Helper Script Loaded");

  checkForUpdates();

  try {
    savedDataShitEntries = JSON.parse(
      localStorage.shitListEntriesList ||
        '{"shitListEntries" : {}, "timestamp" : 0}'
    );
    savedDataShitCategories = JSON.parse(
      localStorage.shitListCategoriesList ||
        '{"shitListCategories" : {}, "timestamp" : 0}'
    );
    savedDataNfhUserRole = JSON.parse(
      localStorage.nfhUserRole || '{"role" : "", "timestamp" : 0}'
    );
    // Load saved contracts data
    savedDataContracts = JSON.parse(
      localStorage.contractsList || '{"contracts": [], "timestamp": 0}'
    );

    shitListEntries = savedDataShitEntries.shitListEntries;
    shitListCategories = savedDataShitCategories.shitListCategories;
    nfhUserRole = savedDataNfhUserRole.role;
    contracts = savedDataContracts.contracts; // Initialize contracts variable

    LogInfo("Loaded Shitlist Entries:", shitListEntries);
    LogInfo("Loaded Shitlist Categories:", shitListCategories);
    LogInfo("Loaded NFH User Role:", nfhUserRole);
    LogInfo("Loaded Contracts:", contracts);
    LogInfo("Saved Contracts Data:", savedDataContracts);
  } catch (error) {
    console.error("Error loading saved data:", error);
    alert("error loading saved data, please reload page!");
  }

  // DEV VALUES
  // GM_setValue("apiToken", "");
  // let apiUrl = "http://torn-faction-companies/api";

  const numFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });

  let apiUrl = "https://nuke.family/api";

  let apiToken = GM_getValue("apiToken", "");

  if (debug) {
    apiToken = "423|T6eyUoGadynPm4WhYhV6h63D83eQyi97RlPmlTa1d0ce2271";
    apiUrl = "http://nuke.test/api";
    GM_setValue("apiToken", apiToken);
  }

  if (!apiToken && !GM_getValue("apiTokenFirstTime", false)) {
    alert(
      "No Nuke.Family API key set yet. You require a https://nuke.family account and key, I'll open a new tab for you to generate the token and will automatically save it for you! Create an account if needed"
    );
    GM_setValue("apiTokenFirstTime", true);
    window.open("https://nuke.family/auth/token-generation", "_blank");
    alert(
      'You will only be asked to enter this key once from the automatic page. If you need to change it later, you can do so by clicking the "Change Payout Nuke Family Key" button on the faction "controls" page.'
    );
  } else if (!apiToken && !IsPage(PageType.NukeFamily3rdParty)) {
    let maybeApiToken = prompt(
      "Please enter your Nuke API key from Fogest's site (https://nuke.family/user)"
    );
    // If the user cancels, maybeApiToken could be null
    if (maybeApiToken && maybeApiToken.length < 30) {
      alert(
        "That key is too short. Please ensure you are using your Nuke.Family " +
          "key (around 50 characters), NOT your Torn API key!"
      );
    } else if (maybeApiToken) {
      // Only store if the token is valid length
      GM_setValue("apiToken", maybeApiToken);
      apiToken = maybeApiToken;
    }
  }

  let xanaxPlayerList = GM_getValue("xanaxPlayerList", {});
  try {
    xanaxPlayerList = JSON.parse(xanaxPlayerList);
  } catch (e) {
    xanaxPlayerList = {};
  }

  // Initial cache checks are now handled by checkCacheUpdates() which runs immediately on load.
  // The old time-based checks below are redundant.

  // Retrieve the anchor from the URL (stuff after the #)
  const anchor = getAnchor();

  let isNukeFamilyInjected = false;

  // Start observer, to inject within dynamically loaded content
  var observer = new MutationObserver(function (mutations, observer) {
    mutations.forEach(function (mutation) {
      for (const node of mutation.addedNodes) {
        if (node.querySelector) {
          if (IsPage(PageType.Profile)) {
            injectProfilePage(node);
          }

          if (IsPage(PageType.FactionArmouryDrug)) {
            insertPayoutHelperButtonForDrugs();
          } else if (IsPage(PageType.FactionControl)) {
            insertPayoutHelperButtonForCash();
          }
        }
      }
    });
  });

  observer.observe(document, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });

  if (IsPage(PageType.NukeFamily3rdParty)) {
    if (!isNukeFamilyInjected) {
      isNukeFamilyInjected = true;

      // Watch for existing #token element, and save value to GM storage if it exists and changes
      // The change to #token would come from Javascript on the page, not a user input
      // The #token element already exists on the page, so we just need to wait till the #token element innerText changes
      // Then update GM storage when it changes to a token
      waitForElm("#token").then((elm) => {
        let token = elm.innerText;

        // Create a new observer
        let observer = new MutationObserver((mutations) => {
          // For each mutation
          for (let mutation of mutations) {
            // If the mutation type is 'characterData' or the 'innerText' of the target has changed
            if (
              mutation.type === "characterData" ||
              mutation.target.innerText !== token
            ) {
              // Update the token
              token = mutation.target.innerText;
              GM_setValue("apiToken", token);
              apiToken = token;
              alert("Nuke Family API token saved. You can now close this tab.");
            }
          }
        });

        // Start observing the target node for configured mutations
        observer.observe(elm, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      });
    }
  }

  // Modified to accept serverTimestamp for accurate cache tracking
  function getContracts(forceFetch = false, serverTimestamp = null) {
    const now = Date.now();
    // Keep the time-based check as a fallback within performTimeBasedCacheCheck
    // The primary trigger is now the timestamp comparison in checkCacheUpdates

    // Always fetch if forceFetch is true (triggered by timestamp mismatch or fallback)
    if (forceFetch) {
      LogInfo(
        `Fetching contracts. Forced: ${forceFetch}, Server Timestamp: ${serverTimestamp}`
      );
      GM_xmlhttpRequest({
        method: "GET",
        url: apiUrl + "/contracts/get_contracts",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + apiToken,
        },
        onload: function (response) {
          if (response.status >= 200 && response.status < 300) {
            const contractsData = JSON.parse(response.responseText);
            // Use serverTimestamp (converted to ms) if provided, otherwise use current time (for fallback)
            const timestampToStore = serverTimestamp
              ? serverTimestamp * 1000
              : now;
            savedDataContracts = {
              contracts: contractsData,
              timestamp: timestampToStore, // Store the server's update time (in ms) or now()
            };
            localStorage.contractsList = JSON.stringify(savedDataContracts);
            contracts = contractsData;
            LogInfo(
              `Contracts updated and stored with timestamp: ${timestampToStore}`
            );
            checkAndInsertActiveContract();
          } else {
            LogInfo(`Failed to fetch contracts. Status: ${response.status}`);
            // Optionally handle error, maybe retry or rely on older cache
          }
        },
        onerror: function (error) {
          console.error("Error fetching contracts:", error);
          LogInfo("Error fetching contracts.");
        },
      });
    } else if (savedDataContracts?.contracts) {
      // If not forcing fetch, but data exists, use it
      contracts = savedDataContracts.contracts;
      checkAndInsertActiveContract(); // Still need to potentially insert the section
    } else {
      // Initial load or cache is empty and not forced fetch (shouldn't happen often with checkCacheUpdates)
      LogInfo("No contracts data available and fetch not forced.");
    }
  }

  function checkAndInsertActiveContract() {
    // Check if factionId is available before proceeding
    LogInfo("Waiting for faction info to load before checking contracts...");
    waitForElm(
      "#profileroot > div > div > div > div:nth-child(5) > div.basic-information.profile-left-wrapper.left > div > div.cont.bottom-round > div > ul > li:nth-child(3) > div.user-information-section"
    ).then((elm) => {
      LogInfo("Checking for active contract...");
      const factionId = getFactionId();
      if (!factionId) {
        return; // No faction, no contract
      }

      const now = new Date();
      const activeContract = contracts.find((contract) => {
        return (
          contract.faction_id == factionId &&
          new Date(contract.contract_start_date) <= now &&
          (!contract.contract_end_date ||
            new Date(contract.contract_end_date) > now)
        );
      });

      if (activeContract) {
        LogInfo("Inserting active contract section:", activeContract);
        insertActiveContractSection(activeContract);
      }
    });
  }

  function insertActiveContractSection(contract) {
    waitForElm(
      "#profileroot > div > div > div > div:nth-child(1) > div.profile-left-wrapper.left > div"
    ).then((elm) => {
      const injectPoint = elm;

      // Build the main wrapper div
      let activeContractDiv = buildActiveContractDiv();

      let activeContractTitle = document.createElement("p");
      activeContractTitle.innerText = "Active Contract";
      activeContractTitle.classList.add(
        "nfh-active-contract-title",
        "nfh-section-title",
        "title-black",
        "top-round"
      );

      // Create the contract info container
      let contractInfoContainer = buildContractInfoContainer(contract);

      activeContractDiv.appendChild(activeContractTitle);
      activeContractDiv.appendChild(contractInfoContainer);

      injectPoint.parentNode.insertBefore(
        activeContractDiv,
        injectPoint.nextSibling
      );
    });
  }

  function buildActiveContractDiv() {
    let outerDiv = document.createElement("div");
    let innerDiv = document.createElement("div");
    outerDiv.classList.add("nfh-active-contract", "nfh-section", "m-top10");
    outerDiv.appendChild(innerDiv);
    return outerDiv;
  }

  function buildContractInfoContainer(contract) {
    let contractInfoContainer = document.createElement("div");
    contractInfoContainer.classList.add(
      "nfh-active-contract-container",
      "nfh-section-container"
    );

    let contractInfoList = document.createElement("ul");
    contractInfoList.classList.add(
      "nfh-active-contract-list",
      "nfh-section-list"
    );

    // Add contract details
    contractInfoList.appendChild(
      createContractListItem(
        "Minimum Revive Chance",
        `${contract.rule_revive_chance_percentage}%`
      )
    );
    contractInfoList.appendChild(
      createContractListItem(
        "Player Status",
        contract.rule_player_status
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase())
      )
    );
    contractInfoList.appendChild(
      createContractListItem(
        "Online Required",
        contract.rule_is_online ? "Yes" : "No"
      )
    );
    contractInfoList.appendChild(
      createContractListItem(
        "Idle Allowed",
        contract.rule_is_away ? "Yes" : "No"
      )
    );
    contractInfoList.appendChild(
      createContractListItem(
        "Offline Allowed",
        contract.rule_is_offline ? "Yes" : "No"
      )
    );
    contractInfoList.appendChild(
      createContractListItem(
        "Premium Contract",
        contract.is_premium ? "Yes" : "No"
      )
    );
    contractInfoList.appendChild(
      createContractListItem(
        "Start Date",
        new Date(contract.contract_start_date).toLocaleString()
      )
    );

    if (contract.note) {
      contractInfoList.appendChild(
        createContractListItem("Note", contract.note)
      );
    }

    contractInfoContainer.appendChild(contractInfoList);
    return contractInfoContainer;
  }

  function createContractListItem(key, value) {
    let li = document.createElement("li");
    li.innerHTML = `<span class="nfh-list-key">${key}:</span><span class="nfh-list-value">${value}</span>`;
    return li;
  }

  // // Only inject if on URL: https://www.torn.com/factions.php
  // if (window.location.href.includes('factions.php')) {
  // 	insertPayoutHelperButtonForCash();
  // 	insertPayoutHelperButtonForDrugs();
  // }

  // // Only inject if on URL: https://www.torn.com/profiles.php
  // if (window.location.href.includes('profiles.php')) {
  // 	injectProfilePage();
  // }

  // waitForElm('div.armoury-msg > div > div> div > div.msg.right-round').then((elm) => {
  // 	window.location.reload();
  // });

  // if (anchor.includes('option=give-to-user')) {
  // 	insertPayoutHelperButtonForCash();
  // } else if (anchor.includes('tab=controls')) {
  // 	// Check if "Give to User" tab has ui-tabs-active class
  // 	const giveToUserTab = document.querySelector('#faction-controls > div.faction-controls-wrap.border-round.ui-tabs.ui-widget.ui-widget-content.ui-corner-all > ul > li.ui-state-default.ui-corner-top.ui-tabs-active.ui-state-active');
  // 	if (giveToUserTab.classList.contains('ui-tabs-active')) {
  // 		insertPayoutHelperButtonForCash();
  // 	}
  // }

  // Fetch from the nuke.family API the shitlist entries for everyone and cache it in GM storage
  // Modified to accept serverTimestamp for accurate cache tracking
  function getShitList(serverTimestamp = null) {
    const now = Date.now();
    LogInfo(`Fetching shitlist. Server Timestamp: ${serverTimestamp}`);
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl + "/shit-lists",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + apiToken,
      },
      onload: function (response) {
        if (response.status >= 200 && response.status < 300) {
          const responseEntries = JSON.parse(response.responseText)["data"];
          let toSave = {};

          // Save data to cached storage
          responseEntries.forEach(function (entry, index) {
            let obj = {};
            obj.entryId = entry.id;
            obj.playerName = entry.playerName;
            obj.playerId = entry.playerId;
            obj.factionId = entry.factionId;
            obj.factionName = entry.factionName;
            obj.isFactionBan = entry.isFactionBan;
            obj.isApproved = entry.isApproved;
            obj.shitListCategoryId = entry.shitListCategoryId;
            obj.reason = entry.reason;
            obj.updatedAt = entry.updated_at;
            obj.shitListCategory = entry.shitListCategory;

            // Finish making this object
            if (entry.isFactionBan)
              toSave["f" + entry.factionId + "#" + entry.id] = obj;
            else toSave["p" + entry.playerId + "#" + entry.id] = obj;
          });

          // Use serverTimestamp (converted to ms) if provided, otherwise use current time (for fallback)
          const timestampToStore = serverTimestamp
            ? serverTimestamp * 1000
            : now;
          savedDataShitEntries = {
            shitListEntries: toSave,
            timestamp: timestampToStore, // Store the server's update time (in ms) or now()
          };
          localStorage.shitListEntriesList =
            JSON.stringify(savedDataShitEntries);
          LogInfo(
            `Shitlist updated and stored with timestamp: ${timestampToStore}`
          );
          shitListEntries = toSave;
          // Refresh the display only if the profile page elements are present
          if (document.getElementById("nfh-shitlist-profile-list")) {
            refreshShitList();
          }
        } else {
          LogInfo(`Failed to fetch shitlist. Status: ${response.status}`);
        }
      },
      onerror: function (error) {
        console.error("Error fetching shitlist:", error);
        LogInfo("Error fetching shitlist.");
      },
    });
  }

  // Fetch from the nuke.family API the shitlist categories and cache it in GM storage
  // Modified to accept serverTimestamp for accurate cache tracking
  function getShitListCategories(serverTimestamp = null) {
    const now = Date.now();
    LogInfo(
      `Fetching shitlist categories. Server Timestamp: ${serverTimestamp}`
    );
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl + "/shit-list-categories",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + apiToken,
      },
      onload: function (response) {
        if (response.status >= 200 && response.status < 300) {
          const responseEntries = JSON.parse(response.responseText)["data"];
          let toSave = {};

          LogInfo(response.responseText);

          // Save data to cached storage
          responseEntries.forEach(function (entry, index) {
            let obj = {};
            obj.entryId = entry.id;
            obj.name = entry.name;
            obj.description = entry.description;
            obj.isFactionBan = entry.is_faction;
            obj.isFriendly = entry.is_friendly;

            toSave[entry.id] = obj;
          });

          // Use serverTimestamp (converted to ms) if provided, otherwise use current time (for fallback)
          const timestampToStore = serverTimestamp
            ? serverTimestamp * 1000
            : now;
          savedDataShitCategories = {
            shitListCategories: toSave,
            timestamp: timestampToStore, // Store the server's update time (in ms) or now()
          };
          localStorage.shitListCategoriesList = JSON.stringify(
            savedDataShitCategories
          );
          LogInfo(
            `Shitlist categories updated and stored with timestamp: ${timestampToStore}`
          );
          shitListCategories = toSave;
          // Potentially update settings panel if it's open
          if (document.querySelector(".nfh-settings-panel")) {
            // Rebuild or update the settings panel if necessary
            // For now, just log, as direct update might be complex
            LogInfo(
              "Settings panel might need refresh due to category update."
            );
          }
        } else {
          LogInfo(
            `Failed to fetch shitlist categories. Status: ${response.status}`
          );
        }
      },
      onerror: function (error) {
        console.error("Error fetching shitlist categories:", error);
        LogInfo("Error fetching shitlist categories.");
      },
    });
  }

  // Fetch the players own role that they have on nuke.family via the API
  // This one doesn't need the new cache check logic as it's checked less frequently
  function getPlayersRoles() {
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl + "/user/get-own-roles",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + apiToken,
      },
      onload: function (response) {
        const role = JSON.parse(response.responseText)["role"];

        localStorage.nfhUserRole = JSON.stringify({
          role: role,
          timestamp: Date.now(),
        });
        LogInfo("Updated users role from nuke.family in local storage");
        nfhUserRole = role;
      },
    });
  }

  // Fetch from the nuke.family API the combined payout sheet for all players and store it by player id
  function getPlayerPayoutList() {
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl + "/payout/get-payout-table",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + apiToken,
      },
      onload: function (response) {
        const payoutList = JSON.parse(response.responseText)["data"];
        let playerPayoutAmounts = {};
        for (let i = 0; i < payoutList.length; i++) {
          LogInfo(
            payoutList[i]["reviver_id"] +
              " - " +
              payoutList[i]["revive_payout_raw"]
          );
          playerPayoutAmounts[payoutList[i]["reviver_id"]] =
            payoutList[i]["revive_payout_raw"];
        }
        insertPayoutBalanceSuggestions(playerPayoutAmounts);
      },
    });
  }

  function insertPayoutBalanceSuggestions(playerPayoutAmounts) {
    let playersOnPage = document.querySelectorAll(
      "#money > div.userlist-wrapper > ul > li > div > a"
    );
    for (let i = 0; i < playersOnPage.length; i++) {
      const playerId = playersOnPage[i].getAttribute("href").split("=")[1];
      const playerPayoutAmount = playerPayoutAmounts[playerId];
      const parentElement = playersOnPage[i].parentElement;

      if (playerPayoutAmount) {
        // const playerPayoutAmountElement = document.createElement('span');
        // playerPayoutAmountElement.classList.add('player-payout-amount');
        // playerPayoutAmountElement.innerText = '$' + playerPayoutAmount;

        let display = parentElement.querySelector(".money");
        // Strip out dollar sign and commas to get raw integer
        let displayRawMoney = parseInt(
          display.innerText.replace(/[^0-9]/g, "")
        );

        let valueElement = parentElement.querySelector("div.edit input");

        let newTotal = displayRawMoney + playerPayoutAmount;
        // Set new total and add span with coloured text
        let newDisplay = numFormat.format(newTotal);
        if (display) {
          display.innerText = newDisplay;
          display.style.color = "red";
        }
        if (valueElement) {
          valueElement.value = newTotal;
        }
      }
    }
    alert(
      'Payout balances updated. If a users balance is in red, this means they earned money. All you need to do is hit the "edit" pencil and then save it. The red amount and amount in the box is their NEW balance with the payout amount already added for you. You just need to save this.'
    );
  }

  // Add event to the xanax "give" button to then trigger watching for the resulting panel to appear
  waitForElm('div.img-wrap[data-itemid="206"]').then((elm) => {
    $("div.img-wrap[data-itemid='206']")
      .parent()
      .find("a.give.active")
      .on("click", function () {
        LogInfo("Xanax give button clicked");
        // Wait for the panel to appear
        insertPayoutXanaxSuggestions(xanaxPlayerList);
      });
  });

  function getPlayerXanaxPayoutList() {
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl + "/payout/get-payout-table?is_api=1",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + apiToken,
      },
      onload: function (response) {
        const payoutList = JSON.parse(response.responseText)["data"];
        LogInfo(payoutList);
        let playerXanaxPayoutAmounts = {};
        for (let i = 0; i < payoutList.length; i++) {
          let xanax = payoutList[i]["revive_xanax_payout"];
          if (xanax > 0) {
            LogInfo(
              payoutList[i]["reviver_id"] +
                " - " +
                payoutList[i]["revive_xanax_payout"] +
                " xanax"
            );
            playerXanaxPayoutAmounts[payoutList[i]["reviver_id"]] = xanax;
          }
        }
        alert(
          'Ready to start paying out xanax! If you refresh and come back to this page it will remember where you left off in your xanax payout. If you need to reset hit the reset button, but remember this will show people again who you may have already paid out xanax to. Also if you hit "cancel" instead of "give" this still counts as the user being paid and they won\'t be in the pay window again.'
        );
        addXanaxToStoredVariable(playerXanaxPayoutAmounts);
      },
    });
  }

  function addXanaxToStoredVariable(xanaxList) {
    GM_setValue("xanaxPlayerList", JSON.stringify(xanaxList));
    xanaxPlayerList = xanaxList;
    updateXanaxPayoutsLeftMessage();
  }

  function resetXanaxPayout() {
    GM_setValue("xanaxPlayerList", null);
    xanaxPlayerList = {};
    window.location.reload();
  }

  function updateXanaxPayoutsLeftMessage() {
    let count = countProperties(xanaxPlayerList);

    const insertLocation = document.querySelector("#faction-armoury-tabs");

    if (count > 0) {
      let existingCheck = insertLocation.querySelector(".xanax-reset-button");
      if (!existingCheck) {
        const xanaxResetButton = document.createElement("button");
        xanaxResetButton.classList.add("xanax-reset-button");
        xanaxResetButton.classList.add("torn-btn");
        xanaxResetButton.innerText = "Clear xanax payout data from memory";

        xanaxResetButton.addEventListener("click", function () {
          resetXanaxPayout();
        });
        insertLocation.appendChild(xanaxResetButton);
      }
    }

    let existingMessage = insertLocation.querySelector(
      ".xanax-payouts-left-message"
    );
    if (existingMessage) {
      existingMessage.innerText =
        "There are " + count + " players left to give xanax.";
    } else {
      const xanaxPayoutsLeftMessage = document.createElement("div");
      xanaxPayoutsLeftMessage.classList.add("xanax-payouts-left-message");
      xanaxPayoutsLeftMessage.innerText =
        "There are " +
        count +
        ' players left to give xanax to. You can start giving xanax by clicking the "Give Xanax" button below.';

      insertLocation.prepend(xanaxPayoutsLeftMessage);
    }
  }

  function insertPayoutXanaxSuggestions(playerXanaxPayoutAmounts) {
    let monitorElm = document.querySelector(
      "div.img-wrap[data-itemid='206']"
    ).parentElement;
    watchForClassChanges(monitorElm, playerXanaxPayoutAmounts); // Start watching for changes to the class of the element
  }

  function suggestNextPlayerXanax(elm, reviver) {
    let playerId = reviver.key;
    let quantity = reviver.value;

    const quantityBox = elm.querySelector("div.quantity-wrap > input");
    quantityBox.value = quantity;

    const searchBox = elm.querySelector(".ac-search");
    searchBox.value = playerId;
    searchBox.dispatchEvent(new Event("focus"));
    searchBox.dispatchEvent(new Event("keydown"));
    searchBox.dispatchEvent(new Event("input"));
    LogInfo("Suggesting " + quantity + " xanax to " + playerId);
  }

  function changePayoutNukeFamilyKey() {
    // Prompt and save changes to the apiToken in GM storage
    let newKey = prompt(
      "Enter the new Nuke.Family API key (should be ~50 characters)."
    );

    if (newKey) {
      if (newKey.length < 30) {
        alert(
          "That key is too short. Please ensure you are using your Nuke.Family " +
            "key, NOT your Torn API key!"
        );
        return;
      }
      GM_setValue("apiToken", newKey);
      apiToken = newKey;
    }
    getPlayersRoles();
    alert(
      "Nuke family key changed to: " +
        newKey +
        ". This key will be used next time you click the payout helper button."
    );
  }

  function insertChangePayoutNukeFamilyKeyButton(
    insertLocation = "#faction-armoury-tabs"
  ) {
    waitForElm(insertLocation).then((elm) => {
      const buttonInsertLocation = elm;
      let btn = document.createElement("button");

      btn.innerHTML = "Change Payout Nuke Family Key";
      btn.classList.add("torn-btn");
      btn.addEventListener("click", function () {
        changePayoutNukeFamilyKey();
      });

      buttonInsertLocation.appendChild(btn);
      LogInfo("Change Payout Nuke Family Key button inserted");

      // Also insert a "Check NFH Updates" button
      let btn2 = document.createElement("button");

      btn2.innerHTML = "Check NFH Updates";
      btn2.classList.add("torn-btn");
      btn2.addEventListener("click", function () {
        // Check for updates and force check
        checkForUpdates(true);
      });

      buttonInsertLocation.appendChild(btn2);
    });
  }

  let isPayoutCashButtonInserted = false;
  function insertPayoutHelperButtonForCash() {
    // If user has no role, don't insert the button
    const shouldInsertButton = nfhUserRole ? true : false;

    if (isPayoutCashButtonInserted) return;
    const insertLocation = "#faction-controls > hr";

    waitForElm(insertLocation).then((elm) => {
      const buttonInsertLocation = elm;
      let btn = document.createElement("button");

      btn.innerHTML = "Payout Helper";
      btn.classList.add("torn-btn");
      btn.addEventListener("click", function () {
        getPlayerPayoutList();
      });

      if (shouldInsertButton) {
        buttonInsertLocation.appendChild(btn);
        LogInfo("Payout Helper button inserted");
      }
    });
    isPayoutCashButtonInserted = true;
    insertChangePayoutNukeFamilyKeyButton(insertLocation);
  }

  let isPayoutDrugsButtonInserted = false;
  function insertPayoutHelperButtonForDrugs() {
    if (isPayoutDrugsButtonInserted) return;
    const insertLocation = "#faction-armoury-tabs";

    waitForElm(insertLocation).then((elm) => {
      const buttonInsertLocation = elm;
      let btn = document.createElement("button");

      btn.innerHTML = "Payout Helper";
      btn.classList.add("torn-btn");
      btn.addEventListener("click", function () {
        getPlayerXanaxPayoutList();
      });

      buttonInsertLocation.prepend(btn);

      if (countProperties(xanaxPlayerList) > 0) {
        updateXanaxPayoutsLeftMessage();
        LogInfo("xanax payouts left message updated");
      }
      LogInfo("Payout Helper button inserted");
    });
    isPayoutDrugsButtonInserted = true;
    insertChangePayoutNukeFamilyKeyButton(insertLocation);
  }

  function insertGiveButtonTracking(btnToTrackElm) {
    btnToTrackElm.on("click", function () {
      LogInfo("Xanax has been sent to somebody :O");
      // Add event to the xanax "give" button to then trigger watching for the resulting panel to appear
      setTimeout(function () {
        waitForElm('div.img-wrap[data-itemid="206"]').then((elm) => {
          LogInfo("Found element again");
          $("div.img-wrap[data-itemid='206']")
            .parent()
            .find("a.give.active")
            .on("click", function () {
              LogInfo("Xanax give button clicked");
              // Wait for the panel to appear
              insertPayoutXanaxSuggestions(xanaxPlayerList);
            });
        });
      }, 500);
    });
  }

  let isProfilePageInjected = false;
  function injectProfilePage(node = undefined) {
    if (isProfilePageInjected) return;
    LogInfo("Profile page detected");
    let el;

    isProfilePageInjected = true;
    waitForElm(".profile-status.m-top10").then((elm) => {
      // waitForElm('.basic-information.profile-left-wrapper.left').then((elm) => {
      LogInfo(elm);
      el = document.querySelectorAll(".profile-status.m-top10");

      let injectPoint = el[0];
      LogInfo(injectPoint);

      // Build the main wrapper div
      let shitListProfileDiv = buildShitListProfileDiv();

      // Create header with settings cog
      let headerDiv = document.createElement("div");
      headerDiv.classList.add("nfh-shitlist-header");

      let shitListProfileTitle = document.createElement("p");
      shitListProfileTitle.innerText = "Nuke Family Shitlist";
      shitListProfileTitle.classList.add(
        "nfh-shitlist-profile-title",
        "nfh-section-title",
        "title-black",
        "top-round"
      );

      // Create settings cog icon
      let settingsCog = document.createElement("span");
      settingsCog.innerHTML = "⚙️"; // Unicode gear icon
      settingsCog.classList.add("nfh-settings-cog");
      settingsCog.title = "Shitlist Settings";

      // Create settings panel
      let settingsPanel = createSettingsPanel();

      // Add click event to toggle settings panel
      settingsCog.addEventListener("click", function () {
        if (settingsPanel.style.display === "none") {
          settingsPanel.style.display = "block";
        } else {
          settingsPanel.style.display = "none";
        }
      });

      // Add elements to header
      headerDiv.appendChild(shitListProfileTitle);
      headerDiv.appendChild(settingsCog);
      headerDiv.appendChild(settingsPanel);

      // Create the unordered list for the shitlist entries and make the shitlist-entry-container div
      let shitListEntryContainer = buildShitListEntryContainer();

      shitListProfileDiv.appendChild(headerDiv);
      shitListProfileDiv.appendChild(shitListEntryContainer);

      injectPoint.parentNode.append(shitListProfileDiv);

      // Check for active contract
      getContracts();
    });
  }

  // HTML BUILDER FUNCTIONS
  function buildShitListEntry(entry) {
    let li = document.createElement("li");

    let extraShitListConditions = entry.isFactionBan ? " [Faction Ban]" : "";
    let approvalStatus =
      !entry.isApproved && !entry.isFactionBan ? " [Pending Approval]" : "";

    // Convert the updatedAt string into a relative time
    let lastUpdatedHTML = "";
    if (entry.updatedAt) {
      const updatedAtDate = new Date(entry.updatedAt);
      const tooltipDate = formatDateTime(updatedAtDate); // "yyyy-mm-dd HH:mm"
      const relativeDate = timeSince(updatedAtDate); // "2 days ago", etc.
      lastUpdatedHTML = `
      <div>
        <span class="nfh-list-key">Updated:</span>
        <span class="nfh-list-value relative-date" title="${tooltipDate}">${relativeDate}</span>
      </div>`;
    }

    li.innerHTML = `
        <div><span class="nfh-list-key">Reason:</span><span class="nfh-list-value">${entry.reason}</span></div>
        <div><span class="nfh-list-key">Category:</span><span class="nfh-list-value">${entry.shitListCategory.name}${extraShitListConditions}${approvalStatus}</span></div>
        ${lastUpdatedHTML}
    `;

    return li;
  }
  function buildShitListProfileDiv() {
    let outerDiv = document.createElement("div");
    let innerDiv = document.createElement("div");
    outerDiv.classList.add("nfh-shitlist-profile", "nfh-section", "m-top10");
    outerDiv.appendChild(innerDiv);
    return outerDiv;
  }

  function createSettingsPanel() {
    const panel = document.createElement("div");
    panel.classList.add("nfh-settings-panel");
    panel.style.display = "none";

    const title = document.createElement("div");
    title.classList.add("nfh-settings-title");
    title.textContent = "Shitlist Settings";

    const categoryList = document.createElement("div");
    categoryList.classList.add("nfh-category-list");

    // Add category toggles
    for (let categoryId in shitListCategories) {
      const category = shitListCategories[categoryId];
      const categoryItem = document.createElement("div");
      categoryItem.classList.add("nfh-category-item");

      if (category.isFactionBan) {
        categoryItem.classList.add("faction-locked");
      }

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = SettingsManager.isCategoryVisible(
        categoryId,
        category.isFactionBan
      );
      checkbox.disabled = category.isFactionBan;
      checkbox.dataset.categoryId = categoryId;

      checkbox.addEventListener("change", function () {
        console.log("Checkbox changed:", this.checked);
        SettingsManager.toggleCategory(categoryId, this.checked);
        refreshShitList();
      });

      const label = document.createElement("span");
      label.textContent = category.name;

      categoryItem.appendChild(checkbox);
      categoryItem.appendChild(label);
      categoryList.appendChild(categoryItem);
    }

    const closeButton = document.createElement("button");
    closeButton.classList.add("nfh-close-settings");
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", function () {
      panel.style.display = "none";
    });

    panel.appendChild(title);
    panel.appendChild(categoryList);
    panel.appendChild(closeButton);

    return panel;
  }

  function setShitListCategoryDescription(categoryId) {
    // Set the description of the category based on the category ID
    // Lookup the category in the shitListCategories object
    let category = shitListCategories[categoryId];
    LogInfo(category);

    // Update the description textarea with the description of the category
    let description = document.getElementById("shitlist-category-description");
    description.innerText = category.description;
  }

  function buildShitListAddContainer(firstLoad = false) {
    // This will contain a mini form to add a new shitlist entry
    // The form will have a dropdown for the category, a text input for the reason, and a submit button
    // When the category is changed it should update a read-only text area with the description of the category
    // On the firstLoad the category dropdown should not be populated/loaded and the container should be hidden
    // When firstLoad is false, the container should be shown and the category dropdown should be populated. The description should be updated based on the selected category
    // When the submit button is clicked, the form should be hidden and the new entry should be added to the shitlist entries list

    if (firstLoad) {
      let shitListAddContainer = document.createElement("div");
      shitListAddContainer.id = "shitlist-add-container";
      shitListAddContainer.classList.add(
        "nfh-shitlist-add-container",
        "cont",
        "bottom-round"
      );

      let shitListAddForm = document.createElement("form");
      shitListAddForm.classList.add("nfh-shitlist-add-form");

      let reason = document.createElement("textarea");
      reason.id = "shitlist-category-reason";
      reason.setAttribute("placeholder", "Reason/Explanation");
      reason.classList.add("nfh-shitlist-add-reason");
      reason.style.marginBottom = "10px";
      reason.style.width = "100%";
      reason.style.height = "65px";
      reason.style.padding = "8px";
      reason.style.resize = "vertical";
      reason.style.borderRadius = "3px";
      reason.style.border = "1px solid #444";
      reason.style.backgroundColor = "#2a2a2a";
      reason.style.color = "#e0e0e0";
      reason.style.boxSizing = "border-box";

      let select = document.createElement("select");
      select.id = "shitlist-category-select";
      select.classList.add("nfh-shitlist-add-select");
      select.style.marginBottom = "10px";

      let option = document.createElement("option");
      option.value = "";
      option.text = "Select a category";
      select.appendChild(option);

      let description = document.createElement("textarea");
      description.setAttribute("readonly", true);
      description.id = "shitlist-category-description";
      description.classList.add("nfh-shitlist-add-description");
      description.style.marginBottom = "10px";
      description.style.width = "100%";
      description.style.height = "50px";

      // Hidden error message spot
      let error = document.createElement("p");
      error.id = "shitlist-add-error";
      error.classList.add("nfh-shitlist-add-error");
      error.style.color = "red";

      let submit = document.createElement("button");
      submit.setAttribute("type", "button");
      submit.id = "shitlist-add-submit";
      submit.classList.add("nfh-btn", "nfh-shitlist-add-submit");
      submit.innerText = "Submit to Shitlist";

      shitListAddForm.appendChild(reason);
      shitListAddForm.appendChild(select);
      shitListAddForm.appendChild(description);
      shitListAddForm.appendChild(error);
      shitListAddForm.appendChild(submit);
      shitListAddContainer.appendChild(shitListAddForm);

      // Do not display the div, it should be hidden
      shitListAddContainer.style.display = "none";
      return shitListAddContainer;
    } else {
      // Populate the select element with options
      let select = document.getElementById("shitlist-category-select");
      select.innerHTML = "";

      for (let key in shitListCategories) {
        let category = shitListCategories[key];
        // Skip categories where is_faction = 1
        if (category.isFactionBan) {
          continue;
        }
        let option = document.createElement("option");
        option.value = category.entryId;
        option.text = category.name;
        select.appendChild(option);
      }

      setShitListCategoryDescription(select.value);

      // Listen for changes to the select element
      select.addEventListener("change", function () {
        let selectedCategoryId = this.value;

        setShitListCategoryDescription(selectedCategoryId);
      });

      // Add event listener to the submit button
      let submit = document.getElementById("shitlist-add-submit");
      submit.addEventListener("click", function () {
        // Get the selected category
        let selectedCategoryId = document.getElementById(
          "shitlist-category-select"
        ).value;
        LogInfo(selectedCategoryId);

        // Get the reason
        let reason = document.getElementById("shitlist-category-reason").value;

        // Get the player ID
        let playerId = getPlayerId();
        LogInfo(playerId);

        // Get the player name
        let playerName = getPlayerName();
        LogInfo(playerName);

        let userscriptPlayerId = getUserscriptUsersPlayerId();
        LogInfo(userscriptPlayerId);

        let userscriptPlayerName = getUserscriptUsersPlayerName();
        LogInfo(userscriptPlayerName);

        // If the category is not selected or there is no reason given (false/empty), show an error message
        if (!selectedCategoryId || !reason || reason.trim() === "") {
          document.getElementById("shitlist-add-error").innerText =
            "Please ensure you select a category and provide a reason/explanation for the shitlisting";
          return;
        }

        // Clear the error message
        document.getElementById("shitlist-add-error").innerText = "";

        // Submit the new shitlist entry to nuke.family via a POST request to /shit-lists
        // It must submit the following fields: playerName, playerId, reporterPlayerName, reporterPlayerId, shitListCategoryId, reason
        GM_xmlhttpRequest({
          method: "POST",
          url: apiUrl + "/shit-lists",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + apiToken,
          },
          data: JSON.stringify({
            playerName: playerName,
            playerId: playerId,
            reporterPlayerName: userscriptPlayerName,
            reporterPlayerId: userscriptPlayerId,
            shitListCategoryId: selectedCategoryId,
            reason: reason,
          }),
          onload: function (response) {
            let errorData = JSON.parse(response.responseText);
            if (response.status >= 200 && response.status < 300) {
              LogInfo("Shitlist entry successfully submitted.");
              // Hide the form
              document.getElementById("shitlist-add-container").style.display =
                "none";
              document.getElementById("shitlist-add-success").style.display =
                "block";

              // Also hide the Add Another Shitlist Reason button with class "nfh-add-to-shitlist" to prevent another submission
              document.getElementsByClassName(
                "nfh-add-to-shitlist"
              )[0].style.display = "none";

              // Update the shitlist so that the user has the new addition
              getShitList();
            } else {
              LogInfo("Failed to submit shitlist entry: " + errorData.message);
              document.getElementById("shitlist-add-error").innerText =
                "There was an error submitting your shitlisting. Please contact Fogest for help if this persists." +
                errorData.message;
            }
          },
          onerror: function (error) {
            let errorData = JSON.parse(error.responseText);
            LogInfo(
              "Error occurred while submitting shitlist entry: " +
                errorData.message
            );
            document.getElementById("shitlist-add-error").innerText =
              "There was an error submitting your shitlisting. Please contact Fogest for help if this persists." +
              errorData.message;
          },
        });
      });

      // Show the container
      document.getElementById("shitlist-add-container").style.display = "block";
    }
    return null;
  }

  function buildShitListEntryContainer() {
    let shitListEntryContainer = document.createElement("div");
    shitListEntryContainer.classList.add(
      "nfh-shitlist-entry-container",
      "nfh-section-container",
      "cont",
      "bottom-round"
    );

    let shitListEntryProfileContainer = document.createElement("div");
    shitListEntryProfileContainer.id = "nfh-shitlist-entry-profile-container";
    shitListEntryProfileContainer.classList.add(
      "nfh-shitlist-entry-profile-container",
      "profile-container"
    );

    let shitListProfileList = document.createElement("ul");
    shitListProfileList.id = "nfh-shitlist-profile-list";
    shitListProfileList.classList.add(
      "nfh-shitlist-profile-list",
      "cont",
      "bottom-round"
    );
    // shitListProfileList.style.listStyleType = "disclosure-closed"; // Right pointing arrow
    // shitListProfileList.style.listStylePosition = "inside";

    // add li for each shitlist entry that matches the profile ID.
    let playerId = getPlayerId();

    let btnAddToShitList = document.createElement("button");
    btnAddToShitList.setAttribute("type", "submit");
    btnAddToShitList.id = "nfh-add-to-shitlist";
    btnAddToShitList.classList.add("torn-btn", "nfh-add-to-shitlist");

    let existingEntry = false;
    let totalEntries = 0;
    let visibleEntries = 0;

    waitForElm("a[href^='/factions.php?step=profile&ID=']").then((elm) => {
      let factionId = getFactionId();
      LogInfo("Faction ID: " + factionId);

      for (let key in shitListEntries) {
        if (key.startsWith("f" + factionId + "#")) {
          let entry = shitListEntries[key];
          totalEntries++;

          // Check if category is visible
          if (
            SettingsManager.isCategoryVisible(
              entry.shitListCategoryId,
              entry.isFactionBan
            )
          ) {
            shitListProfileList.appendChild(buildShitListEntry(entry));
            visibleEntries++;

            shitListEntryProfileContainer.classList.add(
              "nfh-shitlist-entry-profile-container-faction-ban"
            );

            LogInfo(entry.shitListCategory);
            if (entry.shitListCategory.is_friendly) {
              LogInfo("IS FRIENDLY");
              shitListEntryProfileContainer.classList.add(
                "nfh-shitlist-entry-profile-container-friendly"
              );
              shitListEntryContainer.classList.add(
                "nfh-shitlist-entry-container-friendly"
              );
            } else {
              shitListEntryContainer.classList.add(
                "nfh-shitlist-entry-container-entry-present"
              );
            }
            btnAddToShitList.style.marginTop = "7px";
          }
        }
      }

      // Add hidden count message if needed after processing faction entries
      if (totalEntries > visibleEntries) {
        const hiddenCount = totalEntries - visibleEntries;
        const hiddenMsg = document.createElement("div");
        hiddenMsg.classList.add("nfh-hidden-count");
        hiddenMsg.textContent = `${hiddenCount} ${
          hiddenCount === 1 ? "entry" : "entries"
        } hidden by category settings`;
        shitListEntryProfileContainer.appendChild(hiddenMsg);
      }
    });

    LogInfo("Player ID: " + playerId);

    for (let key in shitListEntries) {
      if (key.startsWith("p" + playerId + "#")) {
        totalEntries++;
        let entry = shitListEntries[key];

        // Check if category is visible
        if (
          SettingsManager.isCategoryVisible(
            entry.shitListCategoryId,
            entry.isFactionBan
          )
        ) {
          existingEntry = true;
          shitListProfileList.appendChild(buildShitListEntry(entry));
          visibleEntries++;

          shitListEntryProfileContainer.classList.add(
            "nfh-shitlist-entry-profile-container-profile-ban"
          );
          shitListEntryContainer.classList.add(
            "nfh-shitlist-entry-container-entry-present"
          );
          btnAddToShitList.style.marginTop = "7px";
        }
      }
    }

    // Add hidden count message if needed after processing player entries
    // Only add if not already added by faction entries
    if (
      totalEntries > visibleEntries &&
      !document.querySelector(".nfh-hidden-count")
    ) {
      const hiddenCount = totalEntries - visibleEntries;
      const hiddenMsg = document.createElement("div");
      hiddenMsg.classList.add("nfh-hidden-count");
      hiddenMsg.textContent = `${hiddenCount} ${
        hiddenCount === 1 ? "entry" : "entries"
      } hidden by category settings`;
      shitListEntryProfileContainer.appendChild(hiddenMsg);
    }

    if (visibleEntries > 0) {
      btnAddToShitList.innerText = "Add another Shitlist Reason";
    } else {
      btnAddToShitList.innerText = "Add to Shitlist";
    }

    let shitListAddShitListContainer = buildShitListAddContainer(true);

    btnAddToShitList.addEventListener("click", function () {
      buildShitListAddContainer(false);

      // Hide the button
      btnAddToShitList.style.display = "none";
    });

    // Add a success message that is outside of the container
    // This message should be displayed when a new entry is successfully added to the shitlist
    // It should be hidden by default
    let successMessage = document.createElement("p");
    successMessage.id = "shitlist-add-success";
    successMessage.classList.add("nfh-shitlist-add-success");
    successMessage.style.color = "green";
    successMessage.style.display = "none";
    successMessage.innerText = "Shitlist entry successfully added!";

    shitListEntryProfileContainer.appendChild(shitListProfileList);
    shitListEntryProfileContainer.appendChild(btnAddToShitList);
    shitListEntryProfileContainer.appendChild(successMessage);
    shitListEntryProfileContainer.appendChild(shitListAddShitListContainer);
    shitListEntryContainer.appendChild(shitListEntryProfileContainer);
    return shitListEntryContainer;
  }

  // Webpage specific functions
  function getPlayerId() {
    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical != undefined) {
      let hrefCanon = canonical.href;
      const urlParams = new URLSearchParams(hrefCanon);
      return urlParams.get("https://www.torn.com/profiles.php?XID");
    } else {
      const urlParams = new URL(window.location).searchParams;
      return urlParams.get("XID");
    }
  }

  function getUserscriptUsersPlayerId() {
    try {
      let uid = getCookie("uid");
      return uid;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function getUserscriptUsersPlayerName() {
    let id = getUserscriptUsersPlayerId();
    let data = JSON.parse(sessionStorage.getItem("sidebarData" + id));
    if (data && data.user) {
      return data.user.name;
    }
  }

  function getPlayerName() {
    const nameElement = document.querySelector(
      ".info-table > li:first-child > div.user-info-value > span"
    );
    if (nameElement != undefined) {
      const nameMatch = nameElement.innerText.match(/^(.*?)\s*\[/);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1]; // Returns only the username
      }
    }
    return null;
  }

  function getFactionId() {
    const factionUrl = document.querySelector(
      "a[href^='/factions.php?step=profile&ID=']"
    );
    LogInfo("Faction URL: " + factionUrl);
    if (factionUrl != undefined) {
      let hrefFaction = factionUrl.href;
      const urlParams = new URLSearchParams(hrefFaction);
      LogInfo(urlParams.get("ID"));
      return urlParams.get("ID");
    } else {
      return null;
    }
  }

  function refreshShitList() {
    let shitListProfileList = document.getElementById(
      "nfh-shitlist-profile-list"
    );
    let shitListEntryProfileContainer = document.getElementById(
      "nfh-shitlist-entry-profile-container"
    );
    let btnAddToShitList = document.getElementById("nfh-add-to-shitlist");

    let playerId = getPlayerId();
    let factionId = getFactionId();

    shitListProfileList.innerHTML = "";

    // Remove any existing hidden count message
    const existingHiddenMsg = document.querySelector(".nfh-hidden-count");
    if (existingHiddenMsg) {
      existingHiddenMsg.remove();
    }

    let totalEntries = 0;
    let visibleEntries = 0;

    // Process faction entries
    for (let key in shitListEntries) {
      if (key.startsWith("f" + factionId + "#")) {
        let entry = shitListEntries[key];
        totalEntries++;

        // Check if category is visible
        if (
          SettingsManager.isCategoryVisible(
            entry.shitListCategoryId,
            entry.isFactionBan
          )
        ) {
          shitListProfileList.appendChild(buildShitListEntry(entry));
          visibleEntries++;

          shitListEntryProfileContainer.style.backgroundColor = "#5b3e3e"; // dim red
          btnAddToShitList.style.marginTop = "7px";
        }
      }
    }

    // Process player entries
    for (let key in shitListEntries) {
      if (key.startsWith("p" + playerId + "#")) {
        let entry = shitListEntries[key];
        totalEntries++;

        // Check if category is visible
        if (
          SettingsManager.isCategoryVisible(
            entry.shitListCategoryId,
            entry.isFactionBan
          )
        ) {
          shitListProfileList.appendChild(buildShitListEntry(entry));
          visibleEntries++;

          shitListEntryProfileContainer.style.backgroundColor = "#5b3e3e"; // dim red
          btnAddToShitList.style.marginTop = "7px";
        }
      }
    }

    // Add hidden count message if needed
    if (totalEntries > visibleEntries) {
      const hiddenCount = totalEntries - visibleEntries;
      const hiddenMsg = document.createElement("div");
      hiddenMsg.classList.add("nfh-hidden-count");
      hiddenMsg.textContent = `${hiddenCount} ${
        hiddenCount === 1 ? "entry" : "entries"
      } hidden by category settings`;
      shitListEntryProfileContainer.appendChild(hiddenMsg);
    }
  }

  function checkForUpdates(force = false) {
    const lastCheckTime = localStorage.getItem("nfhLastUpdateCheckTime");
    const currentTime = Date.now();

    if (
      !force &&
      lastCheckTime &&
      currentTime - lastCheckTime < CHECK_INTERVAL
    ) {
      LogInfo(
        "Skipping update check, not enough time has passed since the last check and force update button not pressed"
      );
      // Not enough time has passed since the last check and force is not true
      return;
    }

    LogInfo("Checking for updates..." + lastCheckTime + " " + currentTime);

    GM_xmlhttpRequest({
      method: "GET",
      url: GITHUB_URL,
      onload: function (response) {
        const match = response.responseText.match(/@version\s+([\d.]+)/);
        if (match) {
          const githubVersion = match[1];
          // Semantic version comparison
          const isNewer = compareVersions(githubVersion, CURRENT_VERSION);
          if (isNewer) {
            if (
              confirm(
                "A new version of the Nuclear Family Helper script is available (v" +
                  githubVersion +
                  "). Do you want to update now?"
              )
            ) {
              window.location.href = GITHUB_URL;
            }
          } else if (force) {
            alert(
              "No updates available. You are running version " +
                CURRENT_VERSION +
                ". And the latest published version is " +
                githubVersion +
                "."
            );
          }
        }
      },
    });

    // Update the last check time
    localStorage.setItem("nfhLastUpdateCheckTime", currentTime);
  }

  // Function to compare version strings (e.g., "2.10.0" > "2.9.1")
  function compareVersions(v1, v2) {
    const v1Parts = v1.split(".").map(Number);
    const v2Parts = v2.split(".").map(Number);
    const len = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < len; i++) {
      const v1Part = i < v1Parts.length ? v1Parts[i] : 0;
      const v2Part = i < v2Parts.length ? v2Parts[i] : 0;
      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }
    return false; // Versions are equal
  }

  // Function to check for cache updates using the new endpoint, throttled to run at most every 5 minutes.
  async function checkCacheUpdates() {
    if (!apiToken) {
      LogInfo("API token not available, skipping cache check.");
      // Still run the time-based checks as a fallback even without API token
      performTimeBasedCacheCheck();
      return;
    }

    const now = Date.now();
    const lastApiCheckTimestamp = parseInt(
      localStorage.getItem("nfhLastApiCheckTime") || "0"
    );

    // Check if 5 minutes have passed since the last API check
    if (now - lastApiCheckTimestamp < CACHE_CHECK_INTERVAL) {
      LogInfo(
        `Skipping API cache check, last check was less than ${
          CACHE_CHECK_INTERVAL / 60000
        } minutes ago. Running time-based checks instead.`
      );
      performTimeBasedCacheCheck(); // Run standard time-based checks if API check is skipped
      return;
    }

    LogInfo(
      "Attempting API cache check (more than 5 minutes since last check)."
    );
    try {
      const response = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: apiUrl + "/cache/last-updates",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + apiToken,
          },
          onload: resolve,
          onerror: reject,
          ontimeout: reject,
        });
      });

      if (response.status >= 200 && response.status < 300) {
        // Successfully checked API, store the current time as the last check time
        localStorage.setItem("nfhLastApiCheckTime", now.toString());
        LogInfo(
          `API cache check successful. Last check time updated to: ${new Date(
            now
          ).toISOString()}`
        );

        const serverTimes = JSON.parse(response.responseText);
        LogInfo("Server timestamps:", serverTimes);

        // Load local timestamps safely (these are already loaded at script start, but re-accessing is fine)
        const localContractsTimestamp = savedDataContracts?.timestamp || 0;
        const localShitlistTimestamp = savedDataShitEntries?.timestamp || 0;
        const localCategoriesTimestamp =
          savedDataShitCategories?.timestamp || 0;

        LogInfo("Local timestamps:", {
          contracts: localContractsTimestamp,
          shitlist: localShitlistTimestamp,
          categories: localCategoriesTimestamp,
        });

        // Compare and fetch if necessary (Convert server time (seconds) to ms for comparison)
        if (
          serverTimes.contract_cache_last_update * 1000 >
          localContractsTimestamp
        ) {
          LogInfo("Contracts data is outdated, fetching new data.");
          getContracts(true, serverTimes.contract_cache_last_update); // Pass server timestamp (still in seconds)
        }
        if (
          serverTimes.shitlist_cache_last_update * 1000 >
          localShitlistTimestamp
        ) {
          LogInfo("Shitlist data is outdated, fetching new data.");
          getShitList(serverTimes.shitlist_cache_last_update); // Pass server timestamp (still in seconds)
        }
        if (
          serverTimes.shitlist_category_cache_last_update * 1000 >
          localCategoriesTimestamp
        ) {
          LogInfo("Shitlist categories data is outdated, fetching new data.");
          getShitListCategories(
            serverTimes.shitlist_category_cache_last_update // Pass server timestamp (still in seconds)
          );
        }
        // After processing API results, also run the time-based checks
        // This ensures things like the user role (not covered by API check) still get updated periodically
        LogInfo(
          "Performing standard time-based checks after successful API check."
        );
        performTimeBasedCacheCheck();
      } else {
        LogInfo(
          `Cache check API request failed with status: ${response.status}. Using time-based fallback.`
        );
        // Don't update lastApiCheckTimestamp on failure
        performTimeBasedCacheCheck(); // Fallback to time-based check
      }
    } catch (error) {
      console.error("Cache check API request failed:", error);
      LogInfo("Cache check API request failed. Using time-based fallback.");
      // Don't update lastApiCheckTimestamp on failure
      performTimeBasedCacheCheck(); // Fallback to time-based check
    }
  }

  // Function for the original time-based cache checks (fallback)
  function performTimeBasedCacheCheck() {
    const now = Date.now();
    if (
      !savedDataContracts ||
      now - (savedDataContracts.timestamp || 0) > 6 * 60 * 60 * 1000 // 6 hours
    ) {
      LogInfo("Contracts cache expired (time-based), fetching...");
      getContracts(true); // Fetch using current time as timestamp
    }
    if (
      !savedDataShitEntries ||
      now - (savedDataShitEntries.timestamp || 0) > cacheLength * 60 * 1000
    ) {
      LogInfo("Shitlist cache expired (time-based), fetching...");
      getShitList(); // Fetch using current time as timestamp
    }
    if (
      !savedDataShitCategories ||
      now - (savedDataShitCategories.timestamp || 0) > cacheLength * 60 * 1000
    ) {
      LogInfo("Categories cache expired (time-based), fetching...");
      getShitListCategories(); // Fetch using current time as timestamp
    }
  }

  // Run the cache check logic once on script load
  checkCacheUpdates();

  ////// HELPER FUNCTIONS //////
  function LogInfo(...values) {
    if (!debug) return;
    var now = new Date();
    console.log(": [//* NFH *\\\\] " + now.toISOString(), ...values);
  }

  function IsPage(pageType) {
    let endWith = mapPageAddressEndWith[pageType];
    if (endWith != undefined) {
      return window.location.href.includes(endWith);
    }

    let startWith = mapPageTypeAddress[pageType];
    if (startWith != undefined) {
      return window.location.href.startsWith(startWith);
    }
    return false;
  }

  function IsUrlEndsWith(value) {
    return window.location.href.endsWith(value);
  }

  function addStyle(styleString) {
    const style = document.createElement("style");
    style.textContent = styleString;
    document.head.append(style);
  }

  function getAnchor() {
    var currentUrl = document.URL,
      urlParts = currentUrl.split("#");

    return urlParts.length > 1 ? urlParts[1] : null;
  }

  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  function watchForClassChanges(elm, playerList) {
    let observer = new MutationObserver(function (event) {
      // Pops off the next item from bottom of array
      if (elm.classList.contains("item-give-act")) {
        insertGiveButtonTracking($(elm).find(".torn-btn"));
        suggestNextPlayerXanax(elm, randomProperty(playerList));
        addXanaxToStoredVariable(playerList);
      }
    });

    observer.observe(elm, {
      attributes: true,
      attributeFilter: ["class"],
      childList: false,
      characterData: false,
    });
  }

  // Utility function to format date as "YYYY-MM-DD HH:mm"
  function formatDateTime(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // Utility function to generate a rough "time ago" string (e.g. "2 hours ago")
  function timeSince(dateObj) {
    const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
    if (seconds < 60) {
      return "just now";
    }
    const intervals = [
      { label: "year", secs: 31536000 },
      { label: "month", secs: 2592000 },
      { label: "day", secs: 86400 },
      { label: "hour", secs: 3600 },
      { label: "minute", secs: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.secs);
      if (count >= 1) {
        return count === 1
          ? `${count} ${interval.label} ago`
          : `${count} ${interval.label}s ago`;
      }
    }
    return "just now";
  }

  function randomProperty(obj) {
    let keys = Object.keys(obj);
    let randomKey = keys[(keys.length * Math.random()) << 0];
    let item = obj[randomKey];
    obj[randomKey] = 0;
    delete obj[randomKey];
    return {
      key: randomKey,
      value: item,
    };
  }

  function countProperties(obj) {
    return Object.keys(obj).length;
  }
})();
