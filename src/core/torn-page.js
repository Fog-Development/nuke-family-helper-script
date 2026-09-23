// Helpers for scraping information out of Torn's own pages (current profile,
// logged-in user, etc.).

export function getCookie(name) {
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// The player ID of the profile currently being viewed.
export function getPlayerId() {
  const canonical = document.querySelector("link[rel='canonical']");
  if (canonical != undefined) {
    const urlParams = new URLSearchParams(canonical.href);
    return urlParams.get("https://www.torn.com/profiles.php?XID");
  } else {
    const urlParams = new URL(window.location).searchParams;
    return urlParams.get("XID");
  }
}

// The player name of the profile currently being viewed.
export function getPlayerName() {
  const nameElement = document.querySelector(
    ".info-table > li:first-child > div.user-info-value > span",
  );
  if (nameElement != undefined) {
    const nameMatch = nameElement.innerText.match(/^(.*?)\s*\[/);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1]; // Returns only the username
    }
  }
  return null;
}

// The faction ID of the profile currently being viewed (null if factionless).
export function getFactionId() {
  const factionUrl = document.querySelector(
    ".basic-information .info-table a[href^='/factions.php?step=profile&ID=']",
  );
  if (factionUrl != undefined) {
    const urlParams = new URLSearchParams(factionUrl.href);
    return urlParams.get("ID");
  }
  return null;
}

// The player ID of the logged-in user running this script (from Torn's uid
// cookie).
export function getUserscriptUsersPlayerId() {
  try {
    return getCookie("uid");
  } catch (error) {
    console.error(error);
    return false;
  }
}

// The player name of the logged-in user running this script (from Torn's
// sidebar session data).
export function getUserscriptUsersPlayerName() {
  const id = getUserscriptUsersPlayerId();
  const data = JSON.parse(sessionStorage.getItem("sidebarData" + id));
  if (data && data.user) {
    return data.user.name;
  }
}
