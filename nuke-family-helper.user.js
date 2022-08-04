// ==UserScript==
// @name         Nuke Family Leader Helper
// @namespace    https://nuke.family/
// @version      0.2.2
// @description  Making things easier for Nuke Family leadership. Don't bother trying to use this application unless you have leader permissions, you are required to use special keys generated from the site.
// @author       Fogest <nuke@jhvisser.com>
// @match        https://www.torn.com/factions.php*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAsVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAADAgEIBwIJCAILCQMODAQUEQUYFQcaFgcfGgggGwklIAotJgwyKg46MhA8MxBKPxRQRBZgUhthUhthUxt1ZCB9aiOEcCSIdCaQeyihiSyiiS21mjLBpDXFpzbGqDfHqTfIqjjTszrXtzzZuTzlw0DmxEDnxEDpxkHuy0LxzUNZTIHlAAAAD3RSTlMAAh4tMVtig4WRlqvq8v4ZRfBIAAABcElEQVQ4y4VT2ZKCMBBEReTSVhEX8T5BFMVb8/8ftokhJB5b2w9U9VFkMpnRNImSbpiWZRp6SfuGiu0ih2tXPuyy04CChlN+9at1vKFeVf0aVX5Um5Hai+8np470O6fEVxJVIDgQspKBFSGHAMhPKdfhU5/ce8Lv3Sk9+KjzSh0gIQwbEdg8aQI4z/s3MCEcY+6PczpBg/XDRjPLlV2L+a1dTrMmbNpfFyMisGCBRUFHcEuaDsSFsmeBfUFjQNcMIBXCOehHUT84C54ChmYCNyHM+xdCLv254DfA1Cx4xS/DiH2jsBA8WDSggAdUxWJHSPAjVMVkRaoJWuSLYLBrSnRnYTjrqorOGiWxZjWsFYE2ira6wODBAo+BVGz+WAJbfrmtHM1K/twcU3H9qVAcMTBPtI8icGzng1suRo5hWTSQLLlSVYcawVUGrgE+xhrDTAay4avPF6c5ilP6sLc0HjXfF0eunud9X73/l/fP9f8FWPxZz4MGj9YAAAAASUVORK5CYII=
// @downloadURL  https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js
// @updateURL    https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
	'use strict';

	console.log('Nuke Family Helper Script Loaded');

	// DEV VALUES
	// GM_setValue("apiToken", "");
	// let apiUrl = "http://torn-faction-companies/api";


	const numFormat = new Intl.NumberFormat(
		'en-US',
		{
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			trailingZeroDisplay: 'lessPrecision'
		}
	);


	let apiToken = GM_getValue('apiToken', '');

	if (!apiToken) {
		apiToken = prompt('Please enter your Nuke API key from Fogest\'s site (https://nuke.family/user)');
		GM_setValue("apiToken", apiToken);
	}

	let apiUrl = 'https://nuke.family/api';

	let xanaxPlayerList = GM_getValue('xanaxPlayerList', {});
	try {
		xanaxPlayerList = JSON.parse(xanaxPlayerList);
	} catch (e) {
		xanaxPlayerList = {};
	}

	// Retrieve the anchor from the URL (stuff after the #)
	const anchor = getAnchor();

	insertPayoutHelperButtonForCash();
	insertPayoutHelperButtonForDrugs();

	waitForElm('div.armoury-msg > div > div> div > div.msg.right-round').then((elm) => {
		window.location.reload();
	});

	// if (anchor.includes('option=give-to-user')) {
	// 	insertPayoutHelperButtonForCash();
	// } else if (anchor.includes('tab=controls')) {
	// 	// Check if "Give to User" tab has ui-tabs-active class
	// 	const giveToUserTab = document.querySelector('#faction-controls > div.faction-controls-wrap.border-round.ui-tabs.ui-widget.ui-widget-content.ui-corner-all > ul > li.ui-state-default.ui-corner-top.ui-tabs-active.ui-state-active');
	// 	if (giveToUserTab.classList.contains('ui-tabs-active')) {
	// 		insertPayoutHelperButtonForCash();
	// 	}
	// }

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
					console.log(payoutList[i]['reviver_id'] + ' - ' + payoutList[i]['revive_payout_raw']);
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

	function getPlayerXanaxPayoutList() {
		GM_xmlhttpRequest({
			method: 'GET',
			url: apiUrl + '/payout/get-payout-table?is_api=1',
			headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Bearer " + apiToken },
			onload: function (response) {
				const payoutList = JSON.parse(response.responseText)['data'];
				console.log(payoutList);
				let playerXanaxPayoutAmounts = {};
				for (let i = 0; i < payoutList.length; i++) {
					let xanax = payoutList[i]['revive_xanax_payout'];
					if (xanax > 0) {
						console.log(payoutList[i]['reviver_id'] + ' - ' + payoutList[i]['revive_xanax_payout'] + ' xanax');
						playerXanaxPayoutAmounts[payoutList[i]['reviver_id']] = xanax;
					}
				}
				alert('Ready to start paying out xanax! If you refresh and come back to this page it will remember where you left off in your xanax payout. If you need to reset hit the reset button, but remember this will show people again who you may have already paid out xanax to. Also if you hit "cancel" instead of "give" this still counts as the user being paid and they won\'t be in the pay window again.');
				addXanaxToStoredVariable(playerXanaxPayoutAmounts);
				insertPayoutXanaxSuggestions(playerXanaxPayoutAmounts);
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
		console.log('Suggesting ' + quantity + ' xanax to ' + playerId);
	}

	function insertPayoutHelperButtonForCash() {
		const insertLocation = '#money > div.give-block';
		waitForElm(insertLocation).then((elm) => {
			const buttonInsertLocation = elm;
			let btn = document.createElement('button');

			btn.innerHTML = 'Payout Helper';
			btn.classList.add('torn-btn');
			btn.addEventListener('click', function () {
				getPlayerPayoutList();
			});

			buttonInsertLocation.appendChild(btn);
			console.log('nfh' + ' button inserted on cash page');
		});
	}

	function insertPayoutHelperButtonForDrugs() {
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
				waitForElm("div.img-wrap[data-itemid='206']").then((elm) => {
					insertPayoutXanaxSuggestions(xanaxPlayerList);
				});
				console.log('nfh' + ' message inserted on drugs page');
			}
			console.log('nfh' + ' button inserted on drug page');
		});
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