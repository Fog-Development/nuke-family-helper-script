import { waitForElm } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { shitlistStore } from "./data.js";
import {
  activateShitListAddForm,
  buildHiddenShitListAddContainer,
  showShitlistWarningDialogue,
} from "./form.js";
import { renderShitList } from "./render.js";
import { createSettingsPanel } from "./settings-panel.js";

// Re-render the profile list whenever fresh shitlist data arrives (no-op when
// the section isn't on the page).
shitlistStore.onUpdate = () => renderShitList();

// Gear Icon SVG
const cogSVG = `
      <svg xmlns="http://www.w3.org/2000/svg"
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          style="vertical-align: middle; margin-right: 4px;">
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
        <path d="M21 12a1 1 0 0 1-.74.97l-1.54.47a7.986 7.986 0 0 1-.85 2.05l.64 1.47a1 1 0 0 1-.18 1.11l-1.41 1.41a1 1 0 0 1-1.11.18l-1.47-.64a7.986 7.986 0 0 1-2.05.85l-.47 1.54A1 1 0 0 1 12 21h-2a1 1 0 0 1-.97-.74l-.47-1.54a7.986 7.986 0 0 1-2.05-.85l-1.47.64a1 1 0 0 1-1.11-.18L2.52 16.92a1 1 0 0 1-.18-1.11l.64-1.47a7.986 7.986 0 0 1-.85-2.05L.59 11.82A1 1 0 0 1 0 11V9a1 1 0 0 1 .74-.97l1.54-.47a7.986 7.986 0 0 1 .85-2.05l-.64-1.47a1 1 0 0 1 .18-1.11L4.08 1.52a1 1 0 0 1 1.11-.18l1.47.64a7.986 7.986 0 0 1 2.05-.85L9.18.59A1 1 0 0 1 10 0h2a1 1 0 0 1 .97.74l.47 1.54c.71.2 1.39.51 2.05.85l1.47-.64a1 1 0 0 1 1.11.18l1.41 1.41a1 1 0 0 1 .18 1.11l-.64 1.47c.34.66.65 1.34.85 2.05l1.54.47A1 1 0 0 1 21 9v3zm-2.32-1.5l-1.42-.44a1 1 0 0 1-.68-.82 5.977 5.977 0 0 0-1.19-2.88 1 1 0 0 1-.07-1.06l.59-1.35-1-1-.35.59a1 1 0 0 1-1.06.07 5.977 5.977 0 0 0-2.88-1.19 1 1 0 0 1-.82-.68L10.5 1.32h-1l-.44 1.42a1 1 0 0 1-.82.68 5.977 5.977 0 0 0-2.88 1.19 1 1 0 0 1-1.06-.07L3.25 4.19l-1 1 .59 1.35a1 1 0 0 1-.07 1.06 5.977 5.977 0 0 0-1.19 2.88 1 1 0 0 1-.68.82L1.32 11.5v1l1.42.44a1 1 0 0 1 .68.82 5.977 5.977 0 0 0 1.19 2.88 1 1 0 0 1 .07 1.06l-.59 1.35 1 1 1.35-.59a1 1 0 0 1 1.06.07 5.977 5.977 0 0 0 2.88 1.19 1 1 0 0 1 .82.68l.44 1.42h1l.44-1.42a1 1 0 0 1 .82-.68 5.977 5.977 0 0 0 2.88-1.19 1 1 0 0 1 1.06.07l1.35.59 1-1-.59-1.35a1 1 0 0 1 .07-1.06 5.977 5.977 0 0 0 1.19-2.88 1 1 0 0 1 .68-.82l1.42-.44v-1z"/>
      </svg>
      `;

function init() {
  // Guard on DOM presence rather than a module flag so the section is
  // re-injected if the page rebuilds it (e.g. navigating between profiles
  // without a full reload).
  if (document.querySelector(".nfh-shitlist-profile")) return;
  LogInfo("Profile page detected");

  waitForElm(".profile-status.m-top10").then((injectPoint) => {
    if (document.querySelector(".nfh-shitlist-profile")) return;

    // Build the main wrapper div
    const shitListProfileDiv = document.createElement("div");
    shitListProfileDiv.classList.add(
      "nfh-shitlist-profile",
      "nfh-section",
      "m-top10",
    );
    shitListProfileDiv.appendChild(document.createElement("div"));

    // Create header with settings cog
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("nfh-shitlist-header");

    const shitListProfileTitle = document.createElement("p");
    shitListProfileTitle.innerText = "Nuke Family Shitlist";
    shitListProfileTitle.classList.add(
      "nfh-shitlist-profile-title",
      "nfh-section-title",
      "title-black",
      "top-round",
    );

    const settingsCog = document.createElement("span");
    settingsCog.innerHTML = cogSVG;
    settingsCog.classList.add("nfh-settings-cog");
    settingsCog.title = "Shitlist Settings";

    const settingsPanel = createSettingsPanel();

    settingsCog.addEventListener("click", function () {
      if (settingsPanel.style.display === "none") {
        settingsPanel.style.display = "block";
      } else {
        settingsPanel.style.display = "none";
      }
    });

    headerDiv.appendChild(shitListProfileTitle);
    headerDiv.appendChild(settingsCog);
    headerDiv.appendChild(settingsPanel);

    const shitListEntryContainer = buildShitListEntryContainer();

    shitListProfileDiv.appendChild(headerDiv);
    shitListProfileDiv.appendChild(shitListEntryContainer);

    injectPoint.parentNode.append(shitListProfileDiv);

    // Render the player-level entries right away; faction-level entries can
    // only be rendered once the faction link is on the page (it may never
    // appear if the player is factionless), so re-render when it shows up.
    renderShitList();
    waitForElm(
      ".basic-information .info-table a[href^='/factions.php?step=profile&ID=']",
    ).then(() => renderShitList());
  });
}

// Build the container holding the entry list, the add button, the success
// message and the (hidden) add form.
function buildShitListEntryContainer() {
  const shitListEntryContainer = document.createElement("div");
  shitListEntryContainer.classList.add(
    "nfh-shitlist-entry-container",
    "nfh-section-container",
    "cont",
    "bottom-round",
  );

  const shitListEntryProfileContainer = document.createElement("div");
  shitListEntryProfileContainer.id = "nfh-shitlist-entry-profile-container";
  shitListEntryProfileContainer.classList.add(
    "nfh-shitlist-entry-profile-container",
    "profile-container",
  );

  const shitListProfileList = document.createElement("ul");
  shitListProfileList.id = "nfh-shitlist-profile-list";
  shitListProfileList.classList.add(
    "nfh-shitlist-profile-list",
    "cont",
    "bottom-round",
  );

  const btnAddToShitList = document.createElement("button");
  btnAddToShitList.setAttribute("type", "submit");
  btnAddToShitList.id = "nfh-add-to-shitlist";
  btnAddToShitList.classList.add("torn-btn", "nfh-add-to-shitlist");
  btnAddToShitList.innerText = "Add to Shitlist";

  const shitListAddShitListContainer = buildHiddenShitListAddContainer();

  btnAddToShitList.addEventListener("click", function () {
    // Show warning dialogue first
    showShitlistWarningDialogue(() => {
      activateShitListAddForm();
      // Hide the button
      btnAddToShitList.style.display = "none";
    });
  });

  // Success message, hidden until a new entry is successfully added
  const successMessage = document.createElement("p");
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

export default {
  name: "shitlist-profile",
  pages: [PageType.Profile],
  init,
};
