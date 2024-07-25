// ==UserScript==
// @name         Nuke Family Leader Helper
// @namespace    https://nuke.family/
// @version      2.5.1
// @description  Making things easier for Nuke Family leadership. Don't bother trying to use this application unless you have leader permissions, you are required to use special keys generated from the site.
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

const DEFAULT_VERSION = "2.5.1";
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
let savedDataContracts = null;
let contracts = null;

let shitListEntries = null;
let shitListCategories = null;
let nfhUserRole = null;

(function () {
  "use strict";

  // Inject styles onto page
  const styles = `
:root {
  --shitlist-color: #ff4757;
  --contract-color: #ffa502;
  --light-bg: #f1f2f6;
  --light-text: #2f3542;
  --dark-bg: #2f3542;
  --dark-text: #f1f2f6;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --friendly-color: #2ecc71;
}

.nfh-section {
  margin: 20px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.nfh-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.nfh-section-title {
  font-size: 16px;
  font-weight: 600;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
}

.nfh-section-content {
  padding: 15px 20px;
}

/* Shitlist specific styles */
.nfh-shitlist-profile {
  transition: background 0.3s ease;
  background: linear-gradient(135deg, var(--shitlist-color), #ff6b6b); /* Default background */
}

.nfh-shitlist-profile .nfh-section-title {
  color: white;
  background: inherit; /* Inherit the background from the parent */
}

.nfh-shitlist-profile.nfh-no-entries {
  background: linear-gradient(135deg, var(--light-bg), #dfe4ea);
}

.nfh-shitlist-profile.nfh-no-entries .nfh-section-title {
  color: var(--light-text);
}

.nfh-shitlist-profile.nfh-shitlist-entry-present {
  background: linear-gradient(135deg, var(--shitlist-color), #ff6b6b);
}

.nfh-shitlist-profile.nfh-friendly-entry {
  background: linear-gradient(135deg, var(--friendly-color), #27ae60);
}

.nfh-no-entries .nfh-section-title {
  color: var(--light-text);
}

/* Active Contract specific styles */
.nfh-active-contract {
  background: linear-gradient(135deg, var(--contract-color), #ffd700);
}

.nfh-active-contract .nfh-section-title {
  color: var(--light-text);
}

/* Light mode styles */
body:not(.dark-mode) .nfh-section-content {
  background-color: var(--light-bg);
  color: var(--light-text);
}

/* Dark mode styles */
body.dark-mode .nfh-section-content {
  background-color: var(--dark-bg);
  color: var(--dark-text);
}

.nfh-section-content p {
  margin: 10px 0;
  line-height: 1.5;
}

/* Shitlist entry styles */
.nfh-shitlist-entry {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.nfh-shitlist-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

body.dark-mode .nfh-shitlist-entry {
  background-color: rgba(0, 0, 0, 0.2);
}

.nfh-friendly-entry .nfh-shitlist-entry {
  background-color: rgba(255, 255, 255, 0.2);
}

.nfh-shitlist-entry p {
  margin: 0 0 5px 0;
  font-size: 14px;
}

.nfh-add-to-shitlist {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nfh-add-to-shitlist:hover {
  background-color: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* Additional modern touches */
.nfh-icon {
  margin-right: 10px;
  font-size: 18px;
}

.nfh-badge {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

body.dark-mode .nfh-badge {
  background-color: rgba(0, 0, 0, 0.3);
}

.nfh-shitlist-entry .nfh-badge {
  display: inline-block;
  margin-top: 5px;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  background-color: #3498db;
  color: white;
}

.nfh-input, .nfh-select {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.nfh-input:focus, .nfh-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.nfh-textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f9fa;
  resize: vertical;
  min-height: 100px;
}

.nfh-faction-ban-badge {
  background-color: #e74c3c;
  color: white;
}

.nfh-pending-approval-badge {
  background-color: #f39c12;
  color: white;
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
    apiToken = "120|bEGgcntvN4R8S33PlwEJ0u92M0D5O0YyZ1jETNgt3e5d69a4";
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

  function getContracts(forceUpdate = false) {
    const now = Date.now();
    const cacheTime = forceUpdate ? 15 * 60 * 1000 : 3 * 60 * 60 * 1000; // 15 minutes or 3 hours

    if (savedDataContracts === null) {
      try {
        savedDataContracts = JSON.parse(
          localStorage.contractsList || '{"contracts": [], "timestamp": 0}'
        );
        contracts = savedDataContracts.contracts;
      } catch (error) {
        console.error("Error parsing saved contracts data:", error);
        savedDataContracts = { contracts: [], timestamp: 0 };
        contracts = [];
      }
    }

    if (savedDataContracts && now - savedDataContracts.timestamp < cacheTime) {
      return Promise.resolve(contracts);
    }

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: apiUrl + "/contracts/get_contracts",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + apiToken,
        },
        onload: function (response) {
          const responseContracts = JSON.parse(response.responseText);
          contracts = responseContracts;
          savedDataContracts = { contracts: responseContracts, timestamp: now };
          localStorage.contractsList = JSON.stringify(savedDataContracts);
          LogInfo("Updated contracts local storage");
          resolve(contracts);
        },
        onerror: function (error) {
          LogInfo("Error fetching contracts: " + error);
          reject(error);
        },
      });
    });
  }

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
        try {
          const responseData = JSON.parse(response.responseText);
          LogInfo("Received shit-lists response:", responseData); // Log the entire response

          let responseEntries = responseData;
          if (responseData && responseData.data) {
            responseEntries = responseData.data;
          }

          if (Array.isArray(responseEntries)) {
            let toSave = {};

            // Save data to cached storage
            responseEntries.forEach(function (entry, index) {
              if (entry && typeof entry === "object") {
                let obj = {
                  entryId: entry.id,
                  playerName: entry.playerName,
                  playerId: entry.playerId,
                  factionId: entry.factionId,
                  factionName: entry.factionName,
                  isFactionBan: entry.isFactionBan,
                  isApproved: entry.isApproved,
                  shitListCategoryId: entry.shitListCategoryId,
                  reason: entry.reason,
                  updatedAt: entry.updated_at,
                  shitListCategory: entry.shitListCategory,
                };

                // Finish making this object
                if (entry.isFactionBan && entry.factionId)
                  toSave["f" + entry.factionId + "#" + entry.id] = obj;
                else if (entry.playerId)
                  toSave["p" + entry.playerId + "#" + entry.id] = obj;
              }
            });

            localStorage.shitListEntriesList = JSON.stringify({
              shitListEntries: toSave,
              timestamp: Date.now(),
            });
            LogInfo("Updated shitlist entries local storage");
            shitListEntries = toSave;
            refreshShitList();
          } else {
            LogInfo(
              "Unexpected response format from shit-lists API. Response entries:",
              responseEntries
            );
          }
        } catch (error) {
          LogInfo("Error parsing shit-lists response: " + error);
          LogInfo("Raw response:", response.responseText);
        }
      },
      onerror: function (error) {
        LogInfo("Error fetching shit-lists: " + error);
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

  function isContractActive(contract) {
    const now = new Date();
    const startDate = new Date(contract.contract_start_date);
    const endDate = contract.contract_end_date
      ? new Date(contract.contract_end_date)
      : null;

    return startDate <= now && (!endDate || endDate > now);
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
  async function injectProfilePage(node = undefined) {
    if (isProfilePageInjected) return;
    LogInfo("Profile page detected");

    isProfilePageInjected = true;

    // Wait for the shitlist injection point
    waitForElm(".profile-status.m-top10").then(async (elm) => {
      LogInfo(elm);
      let shitlistInjectPoint = elm;
      LogInfo(shitlistInjectPoint);

      let shitListProfileDiv = buildShitListProfileDiv();
      let shitListEntryContainer = await buildShitListEntryContainer();

      shitListProfileDiv
        .querySelector(".nfh-section-content")
        .appendChild(shitListEntryContainer);
      shitlistInjectPoint.parentNode.append(shitListProfileDiv);
    });

    // Wait for the User Information div to be available on the left side
    waitForElm(
      "#profileroot > div > div > div > div.profile-wrapper > div.profile-left-wrapper.left"
    ).then(async (leftColumn) => {
      // Check for active contract
      try {
        const factionId = await getFactionId();
        if (factionId) {
          const contracts = await getContracts(true);
          const activeContract = contracts.find(
            (c) => c.faction_id == factionId && isContractActive(c)
          );
          if (activeContract) {
            let contractDiv = buildActiveContractDiv(activeContract);
            leftColumn.appendChild(contractDiv);
          }
        }
      } catch (error) {
        LogInfo("Error checking for active contract: " + error);
      }
    });
  }

  // HTML BUILDER FUNCTIONS
  function buildShitListEntry(entry) {
    let entryDiv = document.createElement("div");
    entryDiv.classList.add("nfh-shitlist-entry");

    let content = `
        <p>${entry.reason} (${entry.shitListCategory.name})</p>
        ${
          entry.isFactionBan
            ? '<span class="nfh-badge nfh-faction-ban-badge">Faction Ban</span>'
            : ""
        }
        ${
          !entry.isApproved
            ? '<span class="nfh-badge nfh-pending-approval-badge">Pending Approval</span>'
            : ""
        }
    `;

    entryDiv.innerHTML = content;
    return entryDiv;
  }

  function buildActiveContractDiv(contract) {
    let outerDiv = document.createElement("div");
    outerDiv.classList.add("nfh-section", "nfh-active-contract");

    let title = document.createElement("div");
    title.innerHTML = '<span><i class="nfh-icon">📋</i>Active Contract</span>';
    title.classList.add("nfh-section-title");

    let contentDiv = document.createElement("div");
    contentDiv.classList.add("nfh-section-content");

    let content = `
        <p><strong>Minimum Revive Chance:</strong> ${
          contract.rule_revive_chance_percentage
        }%</p>
        <p><strong>Eligible Status:</strong> ${getEligibleStatus(contract)}</p>
        <p><strong>Player Status:</strong> ${toTitleCase(
          contract.rule_player_status
        )}</p>
        <p><strong>Premium Contract:</strong> ${
          contract.is_premium ? "Yes" : "No"
        }</p>
        <p><strong>Start Date:</strong> ${new Date(
          contract.contract_start_date
        ).toLocaleString()}</p>
        ${contract.note ? `<p><strong>Note:</strong> ${contract.note}</p>` : ""}
    `;

    contentDiv.innerHTML = content;

    outerDiv.appendChild(title);
    outerDiv.appendChild(contentDiv);
    return outerDiv;
  }

  function getEligibleStatus(contract) {
    let status = [];
    if (contract.rule_is_online) status.push("Online");
    if (contract.rule_is_away) status.push("Idle");
    if (contract.rule_is_offline) status.push("Offline");
    return status.join(", ") || "None";
  }

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  function buildShitListProfileDiv() {
    let outerDiv = document.createElement("div");
    outerDiv.classList.add("nfh-section", "nfh-shitlist-profile");

    let title = document.createElement("div");
    title.classList.add("nfh-section-title");
    title.innerHTML =
      '<span><i class="nfh-icon">📋</i>Nuke Family Shitlist</span>';

    let contentDiv = document.createElement("div");
    contentDiv.classList.add("nfh-section-content");

    outerDiv.appendChild(title);
    outerDiv.appendChild(contentDiv);

    return outerDiv;
  }

  function setShitListCategoryDescription(categoryId) {
    let description = document.getElementById("shitlist-category-description");
    if (shitListCategories[categoryId]) {
      description.value = shitListCategories[categoryId].description;
    } else {
      description.value = "No description available for this category.";
    }
  }

  function buildShitListAddContainer(firstLoad = false) {
    console.log("shitListCategories:", shitListCategories);
    let shitListAddContainer = document.createElement("div");
    shitListAddContainer.id = "shitlist-add-container";
    shitListAddContainer.classList.add("nfh-shitlist-add-container");

    let shitListAddForm = document.createElement("form");
    shitListAddForm.classList.add("nfh-shitlist-add-form");

    let reason = document.createElement("input");
    reason.id = "shitlist-category-reason";
    reason.setAttribute("type", "text");
    reason.setAttribute("placeholder", "Reason/Explanation");
    reason.classList.add("nfh-input");

    let select = document.createElement("select");
    select.id = "shitlist-category-select";
    select.classList.add("nfh-select");

    let description = document.createElement("textarea");
    description.setAttribute("readonly", true);
    description.id = "shitlist-category-description";
    description.classList.add("nfh-textarea");

    let error = document.createElement("p");
    error.id = "shitlist-add-error";
    error.classList.add("nfh-error");

    let submit = document.createElement("button");
    submit.setAttribute("type", "button");
    submit.id = "shitlist-add-submit";
    submit.classList.add("nfh-add-to-shitlist");
    submit.innerText = "Submit to Shitlist";

    shitListAddForm.appendChild(reason);
    shitListAddForm.appendChild(select);
    shitListAddForm.appendChild(description);
    shitListAddForm.appendChild(error);
    shitListAddForm.appendChild(submit);
    shitListAddContainer.appendChild(shitListAddForm);

    shitListAddContainer.style.display = firstLoad ? "none" : "block";

    if (!firstLoad) {
      // Update select element to use the version in the dom
      select = document.getElementById("shitlist-category-select");

      // Populate the select element with options
      console.log(select);
      select.innerHTML = '<option value="">Select a category</option>';
      console.log("Populating categories...");
      for (let key in shitListCategories) {
        console.log("Category:", key, shitListCategories[key]);
        let category = shitListCategories[key];
        let option = document.createElement("option");
        option.value = category.entryId;
        option.text = category.name;
        select.appendChild(option);
      }
      console.log("Final select options:", select.innerHTML);

      // Set the first category as default and show its description
      if (select.options.length > 0) {
        select.selectedIndex = 0;
        let firstCategoryId = select.options[0].value;
        setShitListCategoryDescription(firstCategoryId);
      }

      // Listen for changes to the select element
      select.addEventListener("change", function () {
        let selectedCategoryId = this.value;
        setShitListCategoryDescription(selectedCategoryId);
      });

      // Get submit button from the dom
      submit = document.getElementById("shitlist-add-submit");

      // Add event listener to the submit button
      submit.addEventListener("click", submitShitListEntry);
    }

    return shitListAddContainer;
  }

  async function buildShitListEntryContainer() {
    let shitListEntryContainer = document.createElement("div");
    shitListEntryContainer.classList.add("nfh-shitlist-entry-container");

    let shitListEntryProfileContainer = document.createElement("div");
    shitListEntryProfileContainer.id = "nfh-shitlist-entry-profile-container";
    shitListEntryProfileContainer.classList.add(
      "nfh-shitlist-entry-profile-container"
    );

    let shitListProfileList = document.createElement("div");
    shitListProfileList.id = "nfh-shitlist-profile-list";
    shitListProfileList.classList.add("nfh-shitlist-profile-list");

    let playerId = getPlayerId();
    let existingEntry = false;
    let hasFriendlyEntry = false;
    let hasFactionBan = false;

    try {
      const factionId = await getFactionId();
      LogInfo("Faction ID: " + factionId);

      for (let key in shitListEntries) {
        let entry = shitListEntries[key];
        if (
          entry.isFactionBan &&
          factionId &&
          key.startsWith("f" + factionId + "#")
        ) {
          let entryElement = buildShitListEntry(entry);
          if (entryElement instanceof Node) {
            shitListProfileList.appendChild(entryElement);
            existingEntry = true;
            hasFactionBan = true;
            if (entry.shitListCategory.isFriendly) {
              hasFriendlyEntry = true;
            }
          }
        } else if (
          !entry.isFactionBan &&
          key.startsWith("p" + playerId + "#")
        ) {
          let entryElement = buildShitListEntry(entry);
          if (entryElement instanceof Node) {
            shitListProfileList.appendChild(entryElement);
            existingEntry = true;
            if (entry.shitListCategory.isFriendly) {
              hasFriendlyEntry = true;
            }
          }
        }
      }

      updateShitListStyling(existingEntry, hasFriendlyEntry, hasFactionBan);
    } catch (error) {
      LogInfo("Error getting faction ID: " + error);
    }

    let btnAddToShitList = document.createElement("button");
    btnAddToShitList.setAttribute("type", "button");
    btnAddToShitList.id = "nfh-add-to-shitlist";
    btnAddToShitList.classList.add("nfh-add-to-shitlist");
    btnAddToShitList.innerText = existingEntry
      ? "Add another Shitlist Reason"
      : "Add to Shitlist";

    let shitListAddShitListContainer = buildShitListAddContainer(true);

    btnAddToShitList.addEventListener("click", function () {
      buildShitListAddContainer(false);
      shitListAddShitListContainer.style.display = "block";
      btnAddToShitList.style.display = "none";
    });

    let successMessage = document.createElement("p");
    successMessage.id = "shitlist-add-success";
    successMessage.classList.add("nfh-shitlist-add-success");
    successMessage.style.display = "none";
    successMessage.innerText = "Shitlist entry successfully added!";

    shitListEntryProfileContainer.appendChild(shitListProfileList);
    shitListEntryProfileContainer.appendChild(btnAddToShitList);
    shitListEntryProfileContainer.appendChild(successMessage);
    shitListEntryProfileContainer.appendChild(shitListAddShitListContainer);
    shitListEntryContainer.appendChild(shitListEntryProfileContainer);

    return shitListEntryContainer;
  }

  function updateShitListStyling(
    existingEntry,
    hasFriendlyEntry,
    hasFactionBan
  ) {
    let shitListProfileDiv = document.querySelector(".nfh-shitlist-profile");
    let title = shitListProfileDiv.querySelector(".nfh-section-title");

    if (existingEntry) {
      if (hasFriendlyEntry) {
        shitListProfileDiv.classList.add("nfh-friendly-entry");
        title.innerHTML =
          '<span><i class="nfh-icon">👥</i>Nuke Family Friendly</span>';
      } else {
        shitListProfileDiv.classList.add("nfh-shitlist-entry-present");
        title.innerHTML =
          '<span><i class="nfh-icon">⚠️</i>Nuke Family Shitlist</span><span class="nfh-badge">New</span>';
      }
      if (hasFactionBan) {
        title.innerHTML +=
          '<span class="nfh-badge nfh-faction-ban-badge">Faction Ban</span>';
      }
    } else {
      shitListProfileDiv.classList.add("nfh-no-entries");
      title.innerHTML =
        '<span><i class="nfh-icon">📋</i>Nuke Family Shitlist</span>';
    }
  }

  function submitShitListEntry() {
    LogInfo("Submitting shitlist entry...");
    let selectedCategoryId = document.getElementById(
      "shitlist-category-select"
    ).value;
    let reason = document.getElementById("shitlist-category-reason").value;
    let playerId = getPlayerId();
    let playerName = getPlayerName();
    let userscriptPlayerId = getUserscriptUsersPlayerId();
    let userscriptPlayerName = getUserscriptUsersPlayerName();

    if (!selectedCategoryId || !reason || reason.trim() === "") {
      document.getElementById("shitlist-add-error").innerText =
        "Please ensure you select a category and provide a reason/explanation for the shitlisting";
      return;
    }

    document.getElementById("shitlist-add-error").innerText = "";

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
        let responseData = JSON.parse(response.responseText);
        if (response.status >= 200 && response.status < 300) {
          LogInfo("Shitlist entry successfully submitted.");
          document.getElementById("shitlist-add-container").style.display =
            "none";
          document.getElementById("shitlist-add-success").style.display =
            "block";
          document.getElementById("nfh-add-to-shitlist").style.display = "none";
          getShitList();
        } else {
          LogInfo("Failed to submit shitlist entry: " + responseData.message);
          document.getElementById("shitlist-add-error").innerText =
            "There was an error submitting your shitlisting. Please contact Fogest for help if this persists. " +
            responseData.message;
        }
      },
      onerror: function (error) {
        LogInfo("Error occurred while submitting shitlist entry: " + error);
        document.getElementById("shitlist-add-error").innerText =
          "There was an error submitting your shitlisting. Please contact Fogest for help if this persists.";
      },
    });
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
    return new Promise((resolve) => {
      const checkForFaction = () => {
        const factionUrl = document.querySelector(
          "a[href^='/factions.php?step=profile&ID=']"
        );
        if (factionUrl) {
          const urlParams = new URLSearchParams(factionUrl.href);
          resolve(urlParams.get("ID"));
        } else {
          // If no faction found after 5 seconds, resolve with null
          setTimeout(() => resolve(null), 5000);
        }
      };

      // Start checking immediately
      checkForFaction();

      // Also set up a MutationObserver to check as the DOM changes
      const observer = new MutationObserver(checkForFaction);
      observer.observe(document.body, { childList: true, subtree: true });

      // Cleanup the observer after 5 seconds
      setTimeout(() => observer.disconnect(), 5000);
    });
  }

  async function refreshShitList() {
    let shitListProfileList = document.getElementById(
      "nfh-shitlist-profile-list"
    );
    let shitListEntryProfileContainer = document.getElementById(
      "nfh-shitlist-entry-profile-container"
    );
    let btnAddToShitList = document.getElementById("nfh-add-to-shitlist");

    let playerId = getPlayerId();
    let existingEntry = false;
    let hasFriendlyEntry = false;
    let hasFactionBan = false;

    shitListProfileList.innerHTML = "";

    try {
      const factionId = await getFactionId();
      LogInfo("Faction ID: " + factionId);

      for (let key in shitListEntries) {
        let entry = shitListEntries[key];
        if (
          entry.isFactionBan &&
          factionId &&
          key.startsWith("f" + factionId + "#")
        ) {
          shitListProfileList.appendChild(buildShitListEntry(entry));
          existingEntry = true;
          hasFactionBan = true;
          if (entry.shitListCategory.isFriendly) {
            hasFriendlyEntry = true;
          }
        } else if (
          !entry.isFactionBan &&
          key.startsWith("p" + playerId + "#")
        ) {
          shitListProfileList.appendChild(buildShitListEntry(entry));
          existingEntry = true;
          if (entry.shitListCategory.isFriendly) {
            hasFriendlyEntry = true;
          }
        }
      }

      updateShitListStyling(existingEntry, hasFriendlyEntry, hasFactionBan);

      if (existingEntry) {
        btnAddToShitList.innerText = "Add another Shitlist Reason";
      } else {
        btnAddToShitList.innerText = "Add to Shitlist";
      }
    } catch (error) {
      LogInfo("Error refreshing shitlist: " + error);
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
