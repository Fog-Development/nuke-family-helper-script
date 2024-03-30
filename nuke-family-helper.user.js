// ==UserScript==
// @name         Nuke Family Leader Helper
// @namespace    https://nuke.family/
// @version      2.0
// @description  Making things easier for Nuke Family leadership. Don't bother trying to use this application unless you have leader permissions, you are required to use special keys generated from the site.
// @author       Fogest <nuke@jhvisser.com>
// @match        https://www.torn.com/factions.php*
// @match        https://www.torn.com/profiles.php*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAsVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAADAgEIBwIJCAILCQMODAQUEQUYFQcaFgcfGgggGwklIAotJgwyKg46MhA8MxBKPxRQRBZgUhthUhthUxt1ZCB9aiOEcCSIdCaQeyihiSyiiS21mjLBpDXFpzbGqDfHqTfIqjjTszrXtzzZuTzlw0DmxEDnxEDpxkHuy0LxzUNZTIHlAAAAD3RSTlMAAh4tMVtig4WRlqvq8v4ZRfBIAAABcElEQVQ4y4VT2ZKCMBBEReTSVhEX8T5BFMVb8/8ftokhJB5b2w9U9VFkMpnRNImSbpiWZRp6SfuGiu0ih2tXPuyy04CChlN+9at1vKFeVf0aVX5Um5Hai+8np470O6fEVxJVIDgQspKBFSGHAMhPKdfhU5/ce8Lv3Sk9+KjzSh0gIQwbEdg8aQI4z/s3MCEcY+6PczpBg/XDRjPLlV2L+a1dTrMmbNpfFyMisGCBRUFHcEuaDsSFsmeBfUFjQNcMIBXCOehHUT84C54ChmYCNyHM+xdCLv254DfA1Cx4xS/DiH2jsBA8WDSggAdUxWJHSPAjVMVkRaoJWuSLYLBrSnRnYTjrqorOGiWxZjWsFYE2ira6wODBAo+BVGz+WAJbfrmtHM1K/twcU3H9qVAcMTBPtI8icGzng1suRo5hWTSQLLlSVYcawVUGrgE+xhrDTAay4avPF6c5ilP6sLc0HjXfF0eunud9X73/l/fP9f8FWPxZz4MGj9YAAAAASUVORK5CYII=
// @downloadURL  https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js
// @updateURL    https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @connect      nuke.family
// ==/UserScript==

const PageType = {
	Profile: 'Profile',
	RecruitCitizens: 'Recruit Citizens',
	HallOfFame: 'Hall Of Fame',
	Faction: 'Faction',
	Company: 'Company',
	Competition: 'Competition',
	Bounty: 'Bounty',
	Search: 'Search',
	Hospital: 'Hospital',
	Chain: 'Chain',
	FactionControl: 'Faction Control',
	FactionControlPayday: 'Faction Control Per Day',
	FactionControlApplications: 'Faction Control Applications',
	Market: 'Market',
	Forum: 'Forum',
	ForumThread: 'ForumThread',
	ForumSearch: 'ForumSearch',
	Abroad: 'Abroad',
	Enemies: 'Enemies',
	Friends: 'Friends',
	PointMarket: 'Point Market',
	Properties: 'Properties',
	War: 'War',
	ChainReport: 'ChainReport',
	RWReport: 'RWReport',
};

var mapPageTypeAddress = {
	[PageType.Profile]: 'https://www.torn.com/profiles.php',
	[PageType.RecruitCitizens]: 'https://www.torn.com/bringafriend.php',
	[PageType.HallOfFame]: 'https://www.torn.com/halloffame.php',
	[PageType.Faction]: 'https://www.torn.com/factions.php',
	[PageType.Company]: 'https://www.torn.com/joblist.php',
	[PageType.Competition]: 'https://www.torn.com/competition.php',
	[PageType.Bounty]: 'https://www.torn.com/bounties.php',
	[PageType.Search]: 'https://www.torn.com/page.php',
	[PageType.Hospital]: 'https://www.torn.com/hospitalview.php',
	[PageType.Chain]: 'https://www.torn.com/factions.php?step=your#/war/chain',
	[PageType.FactionControl]: 'https://www.torn.com/factions.php?step=your#/tab=controls',
	[PageType.FactionControlPayday]: 'https://www.torn.com/factions.php?step=your#/tab=controls',
	[PageType.FactionControlApplications]: 'https://www.torn.com/factions.php?step=your#/tab=controls',
	[PageType.Market]: 'https://www.torn.com/imarket.php',
	[PageType.Forum]: 'https://www.torn.com/forums.php',
	[PageType.ForumThread]: 'https://www.torn.com/forums.php#/p=threads',
	[PageType.ForumSearch]: 'https://www.torn.com/forums.php#/p=search',
	[PageType.Abroad]: 'https://www.torn.com/index.php?page=people',
	[PageType.Enemies]: 'https://www.torn.com/blacklist.php',
	[PageType.Friends]: 'https://www.torn.com/friendlist.php',
	[PageType.PointMarket]: 'https://www.torn.com/pmarket.php',
	[PageType.Properties]: 'https://www.torn.com/properties.php',
	[PageType.War]: 'https://www.torn.com/war.php',
	[PageType.ChainReport]: 'https://www.torn.com/war.php?step=chainreport',
	[PageType.RWReport]: 'https://www.torn.com/war.php?step=rankreport',
};

var mapPageAddressEndWith = {
	[PageType.FactionControl]: '/tab=controls',
	[PageType.FactionArmouryDrug]: 'tab=armoury&start=0&sub=drugs',
	[PageType.FactionControlPayday] : 'tab=controls&option=pay-day',
	[PageType.FactionControlApplications] : 'tab=controls&option=application'
};

const cacheLength = 60; //minutes

let savedDataShitEntries = null;
let savedDataShitCategories = null;


let shitListEntries = null;
let shitListCategories = null;


(function () {
	'use strict';

	LogInfo('Nuke Family Helper Script Loaded');

	try{
		savedDataShitEntries = JSON.parse(localStorage.shitListEntriesList || '{"shitListEntries" : {}, "timestamp" : 0}');
		savedDataShitCategories = JSON.parse(localStorage.shitListCategoriesList || '{"shitListCategories" : {}, "timestamp" : 0}');

		shitListEntries = savedDataShitEntries.shitListEntries;
		shitListCategories = savedDataShitCategories.shitListCategories;
		LogInfo(shitListEntries);
		LogInfo(shitListCategories);
	}
	catch(error){
		console.error(error);
		alert('error loading saved data, please reload page!');
	}

	// DEV VALUES
	// GM_setValue("apiToken", "");
	// let apiUrl = "http://torn-faction-companies/api";


	const numFormat = new Intl.NumberFormat(
		'en-US',
		{
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
		}
	);

	let apiUrl = 'https://nuke.family/api';

	let apiToken = GM_getValue('apiToken', '');

	// ONLY LEAVE ACTIVE FOR DEV
	const debug = false;
	if (debug) {
		apiToken = '94|ia46tZQ0a75k89yveTX2fQfCVqytkghHYNH2KRwq31e85451';
		apiUrl = 'http://nuke.test/api';
		GM_setValue("apiToken", apiToken);
	}

	if (!apiToken) {
		apiToken = prompt('Please enter your Nuke API key from Fogest\'s site (https://nuke.family/user)');
		GM_setValue("apiToken", apiToken);
	}


	let xanaxPlayerList = GM_getValue('xanaxPlayerList', {});
	try {
		xanaxPlayerList = JSON.parse(xanaxPlayerList);
	} catch (e) {
		xanaxPlayerList = {};
	}


	// Update any data that has expired caches...

	if(savedDataShitEntries.timestamp == undefined || Date.now() - savedDataShitEntries.timestamp > cacheLength * 60 * 1000){ //minutes * seconds * miliseconds
		LogInfo('shitlist data is older than ' + cacheLength + ' minutes, updating now');
		getShitList();
	}

	if(savedDataShitCategories.timestamp == undefined || Date.now() - savedDataShitCategories.timestamp > cacheLength * 60 * 1000){ //minutes * seconds * miliseconds
		LogInfo('shitlist categories data is older than ' + cacheLength + ' minutes, updating now');
		getShitListCategories();
	}

	// Retrieve the anchor from the URL (stuff after the #)
	const anchor = getAnchor();


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
									}
									else if (IsPage(PageType.FactionControl)) {
										insertPayoutHelperButtonForCash();
									}
							}
					}
			});
	});

	observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true });

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
			method: 'GET',
			url: apiUrl + '/shit-lists',
			headers: { "Accept": "application/json", "Authorization": "Bearer " + apiToken },
			onload: function (response) {
				const responseEntries = JSON.parse(response.responseText)['data'];

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
					obj.shitListCategoryId = entry.shitListCategoryId;
					obj.reason = entry.reason;
					obj.updatedAt = entry.updated_at;
					obj.shitListCategory = entry.shitListCategory;

				  // Finish making this object
					if (entry.isFactionBan)
						toSave['f' + entry.factionId + '#' + entry.id] = obj;
					else
						toSave['p' + entry.playerId + '#' + entry.id] = obj;
				});

				localStorage.shitListEntriesList =  JSON.stringify({shitListEntries : toSave, timestamp : Date.now()});
				LogInfo('Updated shitlist entries local storage');
				shitListEntries = toSave;
			}
		});
	}

	// Fetch from the nuke.family API the shitlist categories and cache it in GM storage
	function getShitListCategories() {
		GM_xmlhttpRequest({
			method: 'GET',
			url: apiUrl + '/shit-list-categories',
			headers: { "Accept": "application/json", "Authorization": "Bearer " + apiToken },
			onload: function (response) {
				const responseEntries = JSON.parse(response.responseText)['data'];

				let toSave = {};

			  // Save data to cached storage
				responseEntries.forEach(function (entry, index) {
					let obj = {};
					obj.entryId = entry.id;
					obj.name = entry.name;
					obj.description = entry.description;
					obj.isFactionBan = entry.is_faction;

					toSave[entry.id] = obj;
				});

				localStorage.shitListCategoriesList =  JSON.stringify({shitListCategories : toSave, timestamp : Date.now()});
				LogInfo('Updated shitlist categories local storage');
				shitListCategories = toSave;
			}
		});
	}


	// Fetch from the nuke.family API the combined payout sheet for all players and store it by player id
	function getPlayerPayoutList() {
		GM_xmlhttpRequest({
			method: 'GET',
			url: apiUrl + '/payout/get-payout-table',
			headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Bearer " + apiToken },
			onload: function (response) {
				const payoutList = JSON.parse(response.responseText)['data'];
				let playerPayoutAmounts = {};
				for (let i = 0; i < payoutList.length; i++) {
					LogInfo(payoutList[i]['reviver_id'] + ' - ' + payoutList[i]['revive_payout_raw']);
					playerPayoutAmounts[payoutList[i]['reviver_id']] = payoutList[i]['revive_payout_raw'];
				}
				insertPayoutBalanceSuggestions(playerPayoutAmounts);
			}

		});
	}

	function insertPayoutBalanceSuggestions(playerPayoutAmounts) {
		let playersOnPage = document.querySelectorAll("#money > div.userlist-wrapper > ul > li > div > a");
		for (let i = 0; i < playersOnPage.length; i++) {
			const playerId = playersOnPage[i].getAttribute('href').split('=')[1];
			const playerPayoutAmount = playerPayoutAmounts[playerId];
			const parentElement = playersOnPage[i].parentElement;

			if (playerPayoutAmount) {
				// const playerPayoutAmountElement = document.createElement('span');
				// playerPayoutAmountElement.classList.add('player-payout-amount');
				// playerPayoutAmountElement.innerText = '$' + playerPayoutAmount;

				let display = parentElement.querySelector('.money');
				// Strip out dollar sign and commas to get raw integer
				let displayRawMoney = parseInt(display.innerText.replace(/[^0-9]/g, ''));

				let valueElement = parentElement.querySelector('div.edit input');

				let newTotal = displayRawMoney + playerPayoutAmount;
				// Set new total and add span with coloured text
				let newDisplay = numFormat.format(newTotal);
				if (display) {
					display.innerText = newDisplay;
					display.style.color = 'red';
				}
				if (valueElement) {
					valueElement.value = newTotal;
				}
			}
		}
		alert('Payout balances updated. If a users balance is in red, this means they earned money. All you need to do is hit the "edit" pencil and then save it. The red amount and amount in the box is their NEW balance with the payout amount already added for you. You just need to save this.');
	}

	// Add event to the xanax "give" button to then trigger watching for the resulting panel to appear
	waitForElm('div.img-wrap[data-itemid="206"]').then((elm) => {
		$("div.img-wrap[data-itemid='206']").parent().find('a.give.active').on('click', function () {
			LogInfo('Xanax give button clicked');
			// Wait for the panel to appear
			insertPayoutXanaxSuggestions(xanaxPlayerList);
		});
	});

	function getPlayerXanaxPayoutList() {
		GM_xmlhttpRequest({
			method: 'GET',
			url: apiUrl + '/payout/get-payout-table?is_api=1',
			headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Bearer " + apiToken },
			onload: function (response) {
				const payoutList = JSON.parse(response.responseText)['data'];
				LogInfo(payoutList);
				let playerXanaxPayoutAmounts = {};
				for (let i = 0; i < payoutList.length; i++) {
					let xanax = payoutList[i]['revive_xanax_payout'];
					if (xanax > 0) {
						LogInfo(payoutList[i]['reviver_id'] + ' - ' + payoutList[i]['revive_xanax_payout'] + ' xanax');
						playerXanaxPayoutAmounts[payoutList[i]['reviver_id']] = xanax;
					}
				}
				alert('Ready to start paying out xanax! If you refresh and come back to this page it will remember where you left off in your xanax payout. If you need to reset hit the reset button, but remember this will show people again who you may have already paid out xanax to. Also if you hit "cancel" instead of "give" this still counts as the user being paid and they won\'t be in the pay window again.');
				addXanaxToStoredVariable(playerXanaxPayoutAmounts);
			}
		});
	}

	function addXanaxToStoredVariable(xanaxList) {
		GM_setValue('xanaxPlayerList', JSON.stringify(xanaxList));
		xanaxPlayerList = xanaxList;
		updateXanaxPayoutsLeftMessage();
	}

	function resetXanaxPayout() {
		GM_setValue('xanaxPlayerList', null);
		xanaxPlayerList = {};
		window.location.reload();
	}

	function updateXanaxPayoutsLeftMessage() {
		let count = countProperties(xanaxPlayerList);

		const insertLocation = document.querySelector('#faction-armoury-tabs');

		if (count > 0) {
			let existingCheck = insertLocation.querySelector('.xanax-reset-button');
			if (!existingCheck) {
				const xanaxResetButton = document.createElement('button');
				xanaxResetButton.classList.add('xanax-reset-button');
				xanaxResetButton.classList.add('torn-btn');
				xanaxResetButton.innerText = 'Clear xanax payout data from memory';

				xanaxResetButton.addEventListener('click', function () {
					resetXanaxPayout();
				});
				insertLocation.appendChild(xanaxResetButton);
			}
		}

		let existingMessage = insertLocation.querySelector('.xanax-payouts-left-message');
		if (existingMessage) {
			existingMessage.innerText = 'There are ' + count + ' players left to give xanax.';
		} else {
			const xanaxPayoutsLeftMessage = document.createElement('div');
			xanaxPayoutsLeftMessage.classList.add('xanax-payouts-left-message');
			xanaxPayoutsLeftMessage.innerText = 'There are ' + count + ' players left to give xanax to. You can start giving xanax by clicking the "Give Xanax" button below.';

			insertLocation.prepend(xanaxPayoutsLeftMessage);
		}
	}

	function insertPayoutXanaxSuggestions(playerXanaxPayoutAmounts) {
		let monitorElm = document.querySelector("div.img-wrap[data-itemid='206']").parentElement;
		watchForClassChanges(monitorElm, playerXanaxPayoutAmounts); // Start watching for changes to the class of the element
	}

	function suggestNextPlayerXanax(elm, reviver) {
		let playerId = reviver.key;
		let quantity = reviver.value;


		const quantityBox = elm.querySelector('div.quantity-wrap > input');
		quantityBox.value = quantity;

		const searchBox = elm.querySelector('.ac-search');
		searchBox.value = playerId;
		searchBox.dispatchEvent(new Event('focus'));
		searchBox.dispatchEvent(new Event('keydown'));
		searchBox.dispatchEvent(new Event('input'));
		LogInfo('Suggesting ' + quantity + ' xanax to ' + playerId);
	}

	function changePayoutNukeFamilyKey() {
		// Prompt and save changes to the apiToken in GM storage
		let newKey = prompt('Enter the new nuke family key to use for payout retrieval:');
		if (newKey) {
			GM_setValue('apiToken', newKey);
			apiToken = newKey;
		}
		alert('Nuke family key changed to: ' + newKey + '. This key will be used next time you click the payout helper button.');
	}

	function insertChangePayoutNukeFamilyKeyButton(insertLocation = '#faction-armoury-tabs') {
		waitForElm(insertLocation).then((elm) => {
			const buttonInsertLocation = elm;
			let btn = document.createElement('button');

			btn.innerHTML = 'Change Payout Nuke Family Key';
			btn.classList.add('torn-btn');
			btn.addEventListener('click', function () {
				changePayoutNukeFamilyKey();
			});

			buttonInsertLocation.appendChild(btn);
			LogInfo('Change Payout Nuke Family Key button inserted')
		});
	}

	let isPayoutCashButtonInserted = false;
	function insertPayoutHelperButtonForCash() {
		if (isPayoutCashButtonInserted)
			return;
		const insertLocation = '#faction-controls > hr';

		waitForElm(insertLocation).then((elm) => {
			const buttonInsertLocation = elm;
			let btn = document.createElement('button');

			btn.innerHTML = 'Payout Helper';
			btn.classList.add('torn-btn');
			btn.addEventListener('click', function () {
				getPlayerPayoutList();
			});

			buttonInsertLocation.appendChild(btn);
			LogInfo('Payout Helper button inserted')
		});
		isPayoutCashButtonInserted = true;
		insertChangePayoutNukeFamilyKeyButton(insertLocation);
	}

	let isPayoutDrugsButtonInserted = false;
	function insertPayoutHelperButtonForDrugs() {
		if (isPayoutDrugsButtonInserted)
			return;
		const insertLocation = "#faction-armoury-tabs";

		waitForElm(insertLocation).then((elm) => {
			const buttonInsertLocation = elm;
			let btn = document.createElement('button');

			btn.innerHTML = 'Payout Helper';
			btn.classList.add('torn-btn');
			btn.addEventListener('click', function () {
				getPlayerXanaxPayoutList();
			});

			buttonInsertLocation.prepend(btn);

			if (countProperties(xanaxPlayerList) > 0) {
				updateXanaxPayoutsLeftMessage();
				LogInfo('xanax payouts left message updated');
			}
			LogInfo('Payout Helper button inserted');
		});
		isPayoutDrugsButtonInserted = true;
		insertChangePayoutNukeFamilyKeyButton(insertLocation);
	}

	function insertGiveButtonTracking(btnToTrackElm) {
		btnToTrackElm.on('click', function () {
			LogInfo('Xanax has been sent to somebody :O');
			// Add event to the xanax "give" button to then trigger watching for the resulting panel to appear
			setTimeout(function () {
				waitForElm('div.img-wrap[data-itemid="206"]').then((elm) => {
					LogInfo('Found element again');
					$("div.img-wrap[data-itemid='206']").parent().find('a.give.active').on('click', function () {
						LogInfo('Xanax give button clicked');
						// Wait for the panel to appear
						insertPayoutXanaxSuggestions(xanaxPlayerList);
					});
				});
			}, 500);
		});
	}

 let isProfilePageInjected = false;
 function injectProfilePage(node = undefined) {
	if (isProfilePageInjected)
		return;
	LogInfo('Profile page detected');
  let el;

	isProfilePageInjected = true;
	waitForElm('.profile-status.m-top10').then((elm) => {
		// waitForElm('.basic-information.profile-left-wrapper.left').then((elm) => {
			LogInfo(elm);
			el = document.querySelectorAll('.profile-status.m-top10');

			let injectPoint = el[0];
			LogInfo(injectPoint);

			// Build the main wrapper div
			let shitListProfileDiv = buildShitListProfileDiv();

			let shitListProfileTitle = document.createElement('p');
			shitListProfileTitle.innerText = 'Nuke Family Shitlist';
			shitListProfileTitle.classList.add('nfh-shitlist-profile-title', 'title-black', 'top-round');

			// Create the unordered list for the shitlist entries and make the shitlist-entry-container div
			let shitListEntryContainer = buildShitListEntryContainer()

			shitListProfileDiv.appendChild(shitListProfileTitle);
			shitListProfileDiv.appendChild(shitListEntryContainer);
			
			injectPoint.parentNode.append(shitListProfileDiv);
		// });
	});
 }


 // HTML BUILDER FUNCTIONS
 function buildShitListEntry(entry) {
	 let li = document.createElement('li');
	 if (entry.isFactionBan) {
		li.innerHTML = entry.reason + ' (' + entry.shitListCategory.name + ')' + ' <span style="color:indianred">[Faction Ban]</span>';
		li.classList.add('nfh-shitlist-faction-ban');
	 } else {
	 	li.textContent = entry.reason + ' (' + entry.shitListCategory.name + ')';
		li.classList.add('nfh-shitlist-player');
	 }
	 return li;
 }

 function buildShitListProfileDiv() {
	 let outerDiv = document.createElement('div');
	 let innerDiv = document.createElement('div');
	 outerDiv.classList.add('nfh-shitlist-profile', 'm-top10');
	 outerDiv.appendChild(innerDiv);
	 return outerDiv;
 }

 function setShitListCategoryDescription(categoryId) {// Set the description of the category based on the category ID
	 // Lookup the category in the shitListCategories object
	 let category = shitListCategories[categoryId];
	 LogInfo(category);

	 // Update the description textarea with the description of the category
	 let description = document.getElementById('shitlist-category-description');
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
		let shitListAddContainer = document.createElement('div');
		shitListAddContainer.id = 'shitlist-add-container';
		shitListAddContainer.classList.add('nfh-shitlist-add-container', 'cont', 'bottom-round');

		let shitListAddForm = document.createElement('form');
		shitListAddForm.classList.add('nfh-shitlist-add-form');

		let reason = document.createElement('input');
		reason.id = 'shitlist-category-reason';
		reason.setAttribute('type', 'text');
		reason.setAttribute('placeholder', 'Reason/Explanation');
		reason.classList.add('nfh-shitlist-add-reason');
		reason.style.marginBottom = '10px';

		let select = document.createElement('select');
		select.id = 'shitlist-category-select';
		select.classList.add('nfh-shitlist-add-select');
		select.style.marginBottom = '10px';

		let option = document.createElement('option');
		option.value = '';
		option.text = 'Select a category';
		select.appendChild(option);

		let description = document.createElement('textarea');
		description.setAttribute('readonly', true);
		description.id = 'shitlist-category-description';
		description.classList.add('nfh-shitlist-add-description');
		description.style.marginBottom = '10px';
		description.style.width = '100%';
		description.style.height = '50px';

		// Hidden error message spot
		let error = document.createElement('p');
		error.id = 'shitlist-add-error';
		error.classList.add('nfh-shitlist-add-error');
		error.style.color = 'red';

		let submit = document.createElement('button');
		submit.setAttribute('type', 'button');
		submit.id = 'shitlist-add-submit';
		submit.classList.add('torn-btn', 'nfh-shitlist-add-submit');
		submit.innerText = 'Submit to Shitlist';

		shitListAddForm.appendChild(reason);
		shitListAddForm.appendChild(select);
		shitListAddForm.appendChild(description);
		shitListAddForm.appendChild(error);
		shitListAddForm.appendChild(submit);
		shitListAddContainer.appendChild(shitListAddForm);

		// Do not display the div, it should be hidden
		shitListAddContainer.style.display = 'none';
		return shitListAddContainer;
	} else {
		// Populate the select element with options
		let select = document.getElementById('shitlist-category-select');
		select.innerHTML = '';

		for (let key in shitListCategories) {
			let category = shitListCategories[key];
			let option = document.createElement('option');
			option.value = category.entryId;
			option.text = category.name;
			select.appendChild(option);
		}

		setShitListCategoryDescription(select.value);

		// Listen for changes to the select element
		select.addEventListener('change', function() {
			let selectedCategoryId = this.value;
			
			setShitListCategoryDescription(selectedCategoryId);
		});

		// Add event listener to the submit button
		let submit = document.getElementById('shitlist-add-submit');
		submit.addEventListener('click', function() {
			// Get the selected category
			let selectedCategoryId = document
				.getElementById('shitlist-category-select')
				.value;
			LogInfo(selectedCategoryId);

			// Get the reason
			let reason = document
				.getElementById('shitlist-category-reason')
				.value;
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
			if (!selectedCategoryId || !reason || reason.trim() === ''){
				document.getElementById('shitlist-add-error').innerText = 'Please ensure you select a category and provide a reason/explanation for the shitlisting';
				return;
			}

			// Clear the error message
			document.getElementById('shitlist-add-error').innerText = '';

			// Submit the new shitlist entry to nuke.family via a POST request to /shit-lists
			// It must submit the following fields: playerName, playerId, reporterPlayerName, reporterPlayerId, shitListCategoryId, reason
			GM_xmlhttpRequest({
				method: "POST",
				url: apiUrl + '/shit-lists',
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
					"Authorization": "Bearer " + apiToken
				},
				data: JSON.stringify({
					playerName: playerName,
					playerId: playerId,
					reporterPlayerName: userscriptPlayerName,
					reporterPlayerId: userscriptPlayerId,
					shitListCategoryId: selectedCategoryId,
					reason: reason
				}),
				onload: function(response) {
					let errorData = JSON.parse(response.responseText);
					if (response.status >= 200 && response.status < 300) {
							LogInfo("Shitlist entry successfully submitted.");
							// Hide the form
							document.getElementById('shitlist-add-container').style.display = 'none';
							document.getElementById('shitlist-add-success').style.display = 'block';

							// Update the shitlist so that the user has the new addition
							getShitList();
					} else {
							LogInfo("Failed to submit shitlist entry: " + errorData.message);
							document.getElementById('shitlist-add-error').innerText = 'There was an error submitting your shitlisting. Please contact Fogest for help if this persists.' + errorData.message;
					}
				},
				onerror: function(error) {
					let errorData = JSON.parse(error.responseText);
					LogInfo("Error occurred while submitting shitlist entry: " + errorData.message);
					document.getElementById('shitlist-add-error').innerText = 'There was an error submitting your shitlisting. Please contact Fogest for help if this persists.' + errorData.message;
				}
			});
		});

		// Show the container
    document.getElementById('shitlist-add-container').style.display = 'block';
	}
	return null;
}

 function buildShitListEntryContainer() {
	let shitListEntryContainer = document.createElement('div');
	shitListEntryContainer.classList.add('nfh-shitlist-entry-container', 'cont', 'bottom-round');

	let shitListEntryProfileContainer = document.createElement('div');
	shitListEntryProfileContainer.classList.add('nfh-shitlist-entry-profile-container', 'profile-container');

	// add padding 10px 10px 0
	shitListEntryProfileContainer.style.padding = '10px';

	let shitListProfileList = document.createElement('ul');
	shitListProfileList.classList.add('nfh-shitlist-profile-list', 'cont', 'bottom-round');
	shitListProfileList.style.listStyleType = 'disclosure-closed'; // Right pointing arrow
	shitListProfileList.style.listStylePosition = 'inside';

	

	// add li for each shitlist entry that matches the profile ID.
	let playerId = getPlayerId();

	let btnAddToShitList = document.createElement('button');
		btnAddToShitList.setAttribute("type", "submit");
		btnAddToShitList.classList.add('torn-btn', 'nfh-add-to-shitlist');
		
	

	waitForElm("a[href^='/factions.php?step=profile&ID=']").then((elm) => {
		let factionId = getFactionId();
		LogInfo('Faction ID: ' + factionId);

		for (let key in shitListEntries) {
			if (key.startsWith('f' + factionId + '#')) {
				let entry = shitListEntries[key];
				shitListProfileList.appendChild(buildShitListEntry(entry));
				shitListEntryProfileContainer.style.backgroundColor = '#5b3e3e'; // dim red
				btnAddToShitList.style.marginTop = '7px';
			}
		}
	});
	
	LogInfo('Player ID: ' + playerId);
	
	let existingEntry = false;

	for (let key in shitListEntries) {
		if (key.startsWith('p' + playerId + '#')) {
			existingEntry = true;
			let entry = shitListEntries[key];
			shitListProfileList.appendChild(buildShitListEntry(entry));
			shitListEntryProfileContainer.style.backgroundColor = '#5b3e3e'; // dim red
			btnAddToShitList.style.marginTop = '7px';
		}
	}


	if (existingEntry) {
		btnAddToShitList.innerText = 'Add another Shitlist Reason';
	} else {
		btnAddToShitList.innerText = 'Add to Shitlist';
	}

	let shitListAddShitListContainer = buildShitListAddContainer(true);
	
	btnAddToShitList.addEventListener('click', function () {
		buildShitListAddContainer(false);
	});

	// Add a success message that is outside of the container
	// This message should be displayed when a new entry is successfully added to the shitlist
	// It should be hidden by default
	let successMessage = document.createElement('p');
	successMessage.id = 'shitlist-add-success';
	successMessage.classList.add('nfh-shitlist-add-success');
	successMessage.style.color = 'green';
	successMessage.style.display = 'none';
	successMessage.innerText = 'Shitlist entry successfully added!';

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
			return urlParams.get('https://www.torn.com/profiles.php?XID');
	}
	else {
			const urlParams = new URL(window.location).searchParams;
			return urlParams.get('XID');
	}
 }

function getUserscriptUsersPlayerId() {
	try {
		let uid = getCookie('uid');
		return uid;
	}
	catch(error) {
			console.error(error);
			return false;
	}
}

function getUserscriptUsersPlayerName() {
	let id = getUserscriptUsersPlayerId();
	let data = JSON.parse(sessionStorage.getItem('sidebarData' + id));
	if(data && data.user) {
		return data.user.name;
	}
}

function getPlayerName() {
  const nameElement = document.querySelector('.info-table > li:first-child > div.user-info-value > span');
  if (nameElement != undefined) {
    const nameMatch = nameElement.innerText.match(/^(.*?)\s*\[/);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1]; // Returns only the username
    }
  }
  return null;
}

 function getFactionId() {
	const factionUrl = document.querySelector("a[href^='/factions.php?step=profile&ID=']");
	LogInfo("Faction URL: " + factionUrl);
	if (factionUrl != undefined) {
		let hrefFaction = factionUrl.href;
		const urlParams = new URLSearchParams(hrefFaction);
		LogInfo(urlParams.get('ID'));
		return urlParams.get('ID');
	}
	else {
		return null;
	}
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

	function getAnchor() {
		var currentUrl = document.URL,
			urlParts = currentUrl.split('#');

		return (urlParts.length > 1) ? urlParts[1] : null;
	}

	function waitForElm(selector) {
		return new Promise(resolve => {
			if (document.querySelector(selector)) {
				return resolve(document.querySelector(selector));
			}

			const observer = new MutationObserver(mutations => {
				if (document.querySelector(selector)) {
					resolve(document.querySelector(selector));
					observer.disconnect();
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		});
	}

	function watchForClassChanges(elm, playerList) {
		let observer = new MutationObserver(function (event) {
			// Pops off the next item from bottom of array
			if (elm.classList.contains('item-give-act')) {
				insertGiveButtonTracking($(elm).find('.torn-btn'));
				suggestNextPlayerXanax(elm, randomProperty(playerList));
				addXanaxToStoredVariable(playerList);
			}
		})

		observer.observe(elm, {
			attributes: true,
			attributeFilter: ['class'],
			childList: false,
			characterData: false
		})
	}

	function randomProperty(obj) {
		let keys = Object.keys(obj);
		let randomKey = keys[keys.length * Math.random() << 0];
		let item = obj[randomKey];
		obj[randomKey] = 0;
		delete obj[randomKey];
		return {
			key: randomKey,
			value: item
		}
	}

	function countProperties(obj) {
		return Object.keys(obj).length;
	}
})();
