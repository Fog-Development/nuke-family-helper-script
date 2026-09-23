import { escapeHtml } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { SettingsManager } from "../../core/settings.js";
import { formatDateTime, timeSince } from "../../core/time.js";
import { getFactionId, getPlayerId } from "../../core/torn-page.js";
import { shitlistStore } from "./data.js";

// Build the <li> for one shitlist entry.
export function buildShitListEntry(entry) {
  const li = document.createElement("li");

  const extraShitListConditions = entry.isFactionBan ? " [Faction Ban]" : "";
  const approvalStatus =
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
        <span class="nfh-list-value relative-date" title="${escapeHtml(tooltipDate)}">${escapeHtml(relativeDate)}</span>
      </div>`;
  }

  li.innerHTML = `
        <div><span class="nfh-list-key">Reason:</span><span class="nfh-list-value">${escapeHtml(entry.reason)}</span></div>
        <div><span class="nfh-list-key">Category:</span><span class="nfh-list-value">${escapeHtml(entry.shitListCategory.name)}${extraShitListConditions}${approvalStatus}</span></div>
        ${lastUpdatedHTML}
    `;

  return li;
}

// (Re-)render the shitlist entries into the profile-page section. Reads the
// viewed player/faction from the page at call time, so it can be called
// initially (before the faction link has loaded), again once the faction link
// appears, and again whenever the data or visibility settings change.
export function renderShitList() {
  const shitListProfileList = document.getElementById(
    "nfh-shitlist-profile-list",
  );
  const profileContainer = document.getElementById(
    "nfh-shitlist-entry-profile-container",
  );
  const btnAddToShitList = document.getElementById("nfh-add-to-shitlist");
  if (!shitListProfileList || !profileContainer) {
    return;
  }
  const entryContainer = profileContainer.closest(
    ".nfh-shitlist-entry-container",
  );

  const playerId = getPlayerId();
  const factionId = getFactionId();
  LogInfo(`Rendering shitlist for player ${playerId}, faction ${factionId}`);

  // Reset previous render state
  shitListProfileList.innerHTML = "";
  profileContainer
    .querySelectorAll(".nfh-hidden-count")
    .forEach((el) => el.remove());
  profileContainer.classList.remove(
    "nfh-shitlist-entry-profile-container-faction-ban",
    "nfh-shitlist-entry-profile-container-profile-ban",
    "nfh-shitlist-entry-profile-container-friendly",
  );
  entryContainer?.classList.remove(
    "nfh-shitlist-entry-container-friendly",
    "nfh-shitlist-entry-container-entry-present",
  );

  let totalEntries = 0;
  let visibleEntries = 0;

  const renderGroup = (prefix, onVisible) => {
    const entries = shitlistStore.data;
    for (const key in entries) {
      if (!key.startsWith(prefix)) continue;
      const entry = entries[key];
      totalEntries++;

      if (
        !SettingsManager.isCategoryVisible(
          entry.shitListCategoryId,
          entry.isFactionBan,
        )
      ) {
        continue;
      }

      shitListProfileList.appendChild(buildShitListEntry(entry));
      visibleEntries++;
      onVisible(entry);
    }
  };

  if (factionId) {
    renderGroup("f" + factionId + "#", (entry) => {
      profileContainer.classList.add(
        "nfh-shitlist-entry-profile-container-faction-ban",
      );
      if (entry.shitListCategory && entry.shitListCategory.is_friendly) {
        profileContainer.classList.add(
          "nfh-shitlist-entry-profile-container-friendly",
        );
        entryContainer?.classList.add("nfh-shitlist-entry-container-friendly");
      } else {
        entryContainer?.classList.add(
          "nfh-shitlist-entry-container-entry-present",
        );
      }
    });
  }

  if (playerId) {
    renderGroup("p" + playerId + "#", () => {
      profileContainer.classList.add(
        "nfh-shitlist-entry-profile-container-profile-ban",
      );
      entryContainer?.classList.add(
        "nfh-shitlist-entry-container-entry-present",
      );
    });
  }

  if (totalEntries > visibleEntries) {
    const hiddenCount = totalEntries - visibleEntries;
    const hiddenMsg = document.createElement("div");
    hiddenMsg.classList.add("nfh-hidden-count");
    hiddenMsg.textContent = `${hiddenCount} ${
      hiddenCount === 1 ? "entry" : "entries"
    } hidden by category settings`;
    profileContainer.appendChild(hiddenMsg);
  }

  if (btnAddToShitList) {
    if (visibleEntries > 0) {
      btnAddToShitList.style.marginTop = "7px";
      btnAddToShitList.innerText = "Add another Shitlist Reason";
    } else {
      btnAddToShitList.innerText = "Add to Shitlist";
    }
  }
}
