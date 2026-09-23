import { TOKEN_GENERATION_URL } from "./config.js";

// The nuke.family API token, kept in GM storage so it survives across pages
// and (unlike localStorage) is not accessible to the Torn page itself.
let apiToken = "";

// The Torn page to send the user back to once the token-generation page has
// captured their key (GM storage, so it's readable from nuke.family).
const RETURN_URL_KEY = "nfhTokenReturnUrl";

export function initAuth() {
  apiToken = GM_getValue("apiToken", "");
}

export function getApiToken() {
  return apiToken;
}

export function setApiToken(token) {
  apiToken = token;
  GM_setValue("apiToken", token);
}

// First-run flow: if no token is stored yet, walk the user through generating
// one on nuke.family (first visit offers to take them to the token page, later
// visits fall back to a manual prompt).
//
// This navigates the current tab rather than opening a new one: window.open()
// outside a click handler is blocked by popup blockers (an alert/confirm
// dismissal doesn't count as a user gesture), and TornPDA has no tabs anyway.
// The token-capture page sends the user back here once the key is saved.
export function ensureApiToken() {
  if (apiToken) return;

  if (!GM_getValue("apiTokenFirstTime", false)) {
    GM_setValue("apiTokenFirstTime", true);
    const goNow = confirm(
      "No Nuke.Family API key set yet. You need a https://nuke.family account " +
        "(create one if needed) and a key.\n\n" +
        "Press OK to go to nuke.family now. Your key will be saved " +
        "automatically and you'll be brought back to this page.",
    );
    if (goNow) {
      GM_setValue(RETURN_URL_KEY, window.location.href);
      window.location.href = TOKEN_GENERATION_URL;
    }
  } else {
    const maybeApiToken = prompt(
      "Please enter your Nuke API key from Fogest's site (https://nuke.family/user)",
    );
    // If the user cancels, maybeApiToken could be null
    if (maybeApiToken && maybeApiToken.length < 30) {
      alert(
        "That key is too short. Please ensure you are using your Nuke.Family " +
          "key (around 50 characters), NOT your Torn API key!",
      );
    } else if (maybeApiToken) {
      // Only store if the token is valid length
      setApiToken(maybeApiToken);
    }
  }
}

// Consume the Torn URL stored by the first-run flow. Returns it once (then
// clears it), or null if the user reached the token page some other way.
export function takeTokenReturnUrl() {
  const url = GM_getValue(RETURN_URL_KEY, "");
  if (!url) return null;
  GM_setValue(RETURN_URL_KEY, "");
  return url.startsWith("https://www.torn.com/") ? url : null;
}

// Prompt the user for a replacement API key. Returns the new key, or null if
// the user cancelled or the key failed validation.
export function promptForNewApiKey() {
  const newKey = prompt(
    "Enter the new Nuke.Family API key (should be ~50 characters).",
  );

  if (!newKey) {
    return null;
  }
  if (newKey.length < 30) {
    alert(
      "That key is too short. Please ensure you are using your Nuke.Family " +
        "key, NOT your Torn API key!",
    );
    return null;
  }
  setApiToken(newKey);
  return newKey;
}
