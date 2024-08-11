// ==UserScript==
// @name         Nuke Assistant
// @namespace    https://nuke.family/
// @version      2.6.0
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

const DEFAULT_VERSION = "2.6.0";
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

const cacheLength = 60; //minutes

let savedDataShitEntries = null;
let savedDataShitCategories = null;
let savedDataNfhUserRole = null;

let shitListEntries = null;
let shitListCategories = null;
let nfhUserRole = null;

let savedDataContracts = null;
let contracts = null;

(function () {
  "use strict";

  // Inject styles onto page
  const styles = `
    .nfh-section {
        margin-top: 10px;
        background-color: #1a1a1a;
        border-radius: 5px;
        overflow: hidden;
        font-family: 'Roboto', sans-serif;
    }

    .nfh-section-title {
        padding: 8px 12px;
        font-weight: 600;
        font-size: 14px;
        background-color: #2a2a2a;
        color: #e0e0e0;
    }

    .nfh-section-container {
        padding: 10px 12px !important;
        background-color: #222;
    }

    .nfh-section-list {
        list-style-type: none;
        padding-left: 0;
        margin: 0;
    }

    .nfh-section-list li {
        margin-bottom: 8px;
        padding: 8px 10px 8px 20px;
        background-color: #2a2a2a;
        border-radius: 3px;
        font-size: 13px;
        line-height: 1.4;
        color: #e0e0e0;
        position: relative;
    }

    .nfh-shitlist-entry-profile-container {
      background-color: #222 !important;
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
        background-color: #2a2a2a;
        border-radius: 3px;
        font-size: 13px;
        line-height: 1.4;
        color: #e0e0e0;
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
        color: #b0b0b0;
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
        background-color: #222
    }

    .nfh-extra-shitlist-entry-condition {
        font-size: 12px;
        color: #4caf50;
        margin-left: 5px;
    }

    .nfh-btn {
        background-color: #333;
        color: #e0e0e0;
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
        background-color: #444;
    }
    
    .nfh-shitlist-entry-profile-container-friendly {
      border-right: 3px solid #4caf50;
    }

    .nfh-shitlist-entry-container-friendly {
      background-color: #00ff1466 !important;
      border-left: 0px !important;
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

    shitListEntries = savedDataShitEntries.shitListEntries;
    shitListCategories = savedDataShitCategories.shitListCategories;
    nfhUserRole = savedDataNfhUserRole.role;

    LogInfo(shitListEntries);
    LogInfo(shitListCategories);
    LogInfo(nfhUserRole);
  } catch (error) {
    console.error(error);
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
    apiToken = "94|ia46tZQ0a75k89yveTX2fQfCVqytkghHYNH2KRwq31e85451";
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
    apiToken = prompt(
      "Please enter your Nuke API key from Fogest's site (https://nuke.family/user)"
    );
    GM_setValue("apiToken", apiToken);
  }

  let xanaxPlayerList = GM_getValue("xanaxPlayerList", {});
  try {
    xanaxPlayerList = JSON.parse(xanaxPlayerList);
  } catch (e) {
    xanaxPlayerList = {};
  }

  // Update any data that has expired caches...

  if (
    savedDataShitEntries.timestamp == undefined ||
    Date.now() - savedDataShitEntries.timestamp > cacheLength * 60 * 1000
  ) {
    //minutes * seconds * miliseconds
    LogInfo(
      "shitlist data is older than " + cacheLength + " minutes, updating now"
    );
    getShitList();
  }

  if (
    savedDataShitCategories.timestamp == undefined ||
    Date.now() - savedDataShitCategories.timestamp > cacheLength * 60 * 1000
  ) {
    //minutes * seconds * miliseconds
    LogInfo(
      "shitlist categories data is older than " +
        cacheLength +
        " minutes, updating now"
    );
    getShitListCategories();
  }

  if (
    savedDataNfhUserRole.timestamp == undefined ||
    Date.now() - savedDataNfhUserRole.timestamp >
      (cacheLength + 2880) * 60 * 1000
  ) {
    // every 2 days + cacheLength
    LogInfo(
      "user role data is older than " + cacheLength + " minutes, updating now"
    );
    getPlayersRoles();
  }

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

  function getContracts(forceFetch = false) {
    const now = Date.now();
    const cacheAge = now - (savedDataContracts?.timestamp || 0);
    const shouldFetch =
      forceFetch || !savedDataContracts || cacheAge > 3 * 60 * 60 * 1000; // 3 hours

    if (shouldFetch) {
      GM_xmlhttpRequest({
        method: "GET",
        url: apiUrl + "/contracts/get_contracts",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + apiToken,
        },
        onload: function (response) {
          const contractsData = JSON.parse(response.responseText);
          savedDataContracts = {
            contracts: contractsData,
            timestamp: now,
          };
          localStorage.contractsList = JSON.stringify(savedDataContracts);
          contracts = contractsData;
          checkAndInsertActiveContract();
        },
      });
    } else {
      contracts = savedDataContracts.contracts;
      checkAndInsertActiveContract();
    }
  }

  function checkAndInsertActiveContract() {
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
      insertActiveContractSection(activeContract);
    }
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
  function getShitList() {
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl + "/shit-lists",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + apiToken,
      },
      onload: function (response) {
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

        localStorage.shitListEntriesList = JSON.stringify({
          shitListEntries: toSave,
          timestamp: Date.now(),
        });
        LogInfo("Updated shitlist entries local storage");
        shitListEntries = toSave;
        refreshShitList();
      },
    });
  }

  // Fetch from the nuke.family API the shitlist categories and cache it in GM storage
  function getShitListCategories() {
    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl + "/shit-list-categories",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + apiToken,
      },
      onload: function (response) {
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

        localStorage.shitListCategoriesList = JSON.stringify({
          shitListCategories: toSave,
          timestamp: Date.now(),
        });
        LogInfo("Updated shitlist categories local storage");
        shitListCategories = toSave;
      },
    });
  }

  // Fetch the players own role that they have on nuke.family via the API
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
      "Enter the new nuke family key to use for payout retrieval:"
    );
    if (newKey) {
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

      let shitListProfileTitle = document.createElement("p");
      shitListProfileTitle.innerText = "Nuke Family Shitlist";
      shitListProfileTitle.classList.add(
        "nfh-shitlist-profile-title",
        "nfh-section-title",
        "title-black",
        "top-round"
      );

      // Create the unordered list for the shitlist entries and make the shitlist-entry-container div
      let shitListEntryContainer = buildShitListEntryContainer();

      shitListProfileDiv.appendChild(shitListProfileTitle);
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

    li.innerHTML = `
        <div><span class="nfh-list-key">Reason:</span><span class="nfh-list-value">${entry.reason}</span></div>
        <div><span class="nfh-list-key">Category:</span><span class="nfh-list-value">${entry.shitListCategory.name}${extraShitListConditions}${approvalStatus}</span></div>
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

      let reason = document.createElement("input");
      reason.id = "shitlist-category-reason";
      reason.setAttribute("type", "text");
      reason.setAttribute("placeholder", "Reason/Explanation");
      reason.classList.add("nfh-shitlist-add-reason");
      reason.style.marginBottom = "10px";

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
        LogInfo(reason);

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

    waitForElm("a[href^='/factions.php?step=profile&ID=']").then((elm) => {
      let factionId = getFactionId();
      LogInfo("Faction ID: " + factionId);

      for (let key in shitListEntries) {
        if (key.startsWith("f" + factionId + "#")) {
          let entry = shitListEntries[key];
          shitListProfileList.appendChild(buildShitListEntry(entry));
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
    });

    LogInfo("Player ID: " + playerId);

    for (let key in shitListEntries) {
      if (key.startsWith("p" + playerId + "#")) {
        existingEntry = true;
        let entry = shitListEntries[key];
        shitListProfileList.appendChild(buildShitListEntry(entry));
        shitListEntryProfileContainer.classList.add(
          "nfh-shitlist-entry-profile-container-profile-ban"
        );
        shitListEntryContainer.classList.add(
          "nfh-shitlist-entry-container-entry-present"
        );
        btnAddToShitList.style.marginTop = "7px";
      }
    }

    if (existingEntry) {
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

    for (let key in shitListEntries) {
      if (key.startsWith("f" + factionId + "#")) {
        let entry = shitListEntries[key];
        shitListProfileList.appendChild(buildShitListEntry(entry));
        shitListEntryProfileContainer.style.backgroundColor = "#5b3e3e"; // dim red
        btnAddToShitList.style.marginTop = "7px";
      }
    }

    for (let key in shitListEntries) {
      if (key.startsWith("p" + playerId + "#")) {
        let entry = shitListEntries[key];
        shitListProfileList.appendChild(buildShitListEntry(entry));
        shitListEntryProfileContainer.style.backgroundColor = "#5b3e3e"; // dim red
        btnAddToShitList.style.marginTop = "7px";
      }
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
          if (githubVersion > CURRENT_VERSION) {
            if (
              confirm(
                "A new version of the Nuclear Family Helper script is available. Do you want to update now?"
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

  ////// HELPER FUNCTIONS //////

  function LogInfo(value) {
    var now = new Date();
    console.log(": [//* NFH *\\\\] " + now.toISOString(), value);
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
