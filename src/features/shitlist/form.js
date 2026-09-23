import { api } from "../../core/api.js";
import { LogInfo } from "../../core/log.js";
import {
  getPlayerId,
  getPlayerName,
  getUserscriptUsersPlayerId,
  getUserscriptUsersPlayerName,
} from "../../core/torn-page.js";
import { categoriesStore, shitlistStore } from "./data.js";

// Modal warning shown before the add-to-shitlist form is revealed.
export function showShitlistWarningDialogue(onConfirm) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  overlay.style.zIndex = "10000";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  // Create dialogue box
  const dialogue = document.createElement("div");
  dialogue.style.backgroundColor = "#2a2a2a";
  dialogue.style.border = "2px solid #444";
  dialogue.style.borderRadius = "8px";
  dialogue.style.padding = "25px";
  dialogue.style.maxWidth = "500px";
  dialogue.style.color = "#ddd";
  dialogue.style.fontFamily = "Arial, sans-serif";
  dialogue.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.5)";

  const title = document.createElement("h3");
  title.textContent = "⚠️ Shitlist Submission Warning";
  title.style.color = "#ff6b6b";
  title.style.marginTop = "0";
  title.style.marginBottom = "15px";
  title.style.fontSize = "18px";

  const content = document.createElement("div");
  content.innerHTML = `
      <p><strong>Please ensure you provide a detailed explanation:</strong></p>
      <ul style="margin-left: 20px; line-height: 1.6; list-style-type: disc !important; padding-left: 20px;">
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;">All shitlist entries require a clear, detailed reason</li>
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;"><strong>For "buy mugging" reports:</strong> You MUST include a log showing both the buy transaction AND the attack entry, or your report will be rejected</li>
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;">Vague or incomplete reasons will result in rejection</li>
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;">Review your submission carefully before proceeding</li>
      </ul>
    `;
  content.style.marginBottom = "20px";
  content.style.lineHeight = "1.5";

  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "10px";
  buttonContainer.style.justifyContent = "flex-end";

  const proceedBtn = document.createElement("button");
  proceedBtn.textContent = "I Understand - Proceed";
  proceedBtn.classList.add("torn-btn");
  proceedBtn.style.backgroundColor = "#28a745";
  proceedBtn.style.border = "none";
  proceedBtn.style.borderRadius = "4px";
  proceedBtn.style.color = "white";
  proceedBtn.style.cursor = "pointer";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.classList.add("torn-btn");
  cancelBtn.style.backgroundColor = "#6c757d";
  cancelBtn.style.border = "none";
  cancelBtn.style.borderRadius = "4px";
  cancelBtn.style.color = "white";
  cancelBtn.style.cursor = "pointer";

  proceedBtn.addEventListener("click", function () {
    document.body.removeChild(overlay);
    onConfirm();
  });

  cancelBtn.addEventListener("click", function () {
    document.body.removeChild(overlay);
  });

  // Close on overlay click
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(proceedBtn);
  dialogue.appendChild(title);
  dialogue.appendChild(content);
  dialogue.appendChild(buttonContainer);
  overlay.appendChild(dialogue);

  document.body.appendChild(overlay);
}

function setShitListCategoryDescription(categoryId) {
  const category = categoriesStore.data[categoryId];
  LogInfo(category);

  const description = document.getElementById("shitlist-category-description");
  description.innerText = category ? category.description : "";
}

// Build the hidden add-to-shitlist form (initial, hidden state).
export function buildHiddenShitListAddContainer() {
  const shitListAddContainer = document.createElement("div");
  shitListAddContainer.id = "shitlist-add-container";
  shitListAddContainer.classList.add(
    "nfh-shitlist-add-container",
    "cont",
    "bottom-round",
  );

  const shitListAddForm = document.createElement("form");
  shitListAddForm.classList.add("nfh-shitlist-add-form");

  const reason = document.createElement("textarea");
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

  const select = document.createElement("select");
  select.id = "shitlist-category-select";
  select.classList.add("nfh-shitlist-add-select");
  select.style.marginBottom = "10px";

  const option = document.createElement("option");
  option.value = "";
  option.text = "Select a category";
  select.appendChild(option);

  const description = document.createElement("textarea");
  description.setAttribute("readonly", true);
  description.id = "shitlist-category-description";
  description.classList.add("nfh-shitlist-add-description");
  description.style.marginBottom = "10px";
  description.style.width = "100%";
  description.style.height = "50px";

  // Hidden error message spot
  const error = document.createElement("p");
  error.id = "shitlist-add-error";
  error.classList.add("nfh-shitlist-add-error");
  error.style.color = "red";

  const submit = document.createElement("button");
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
}

// Populate and reveal the add-to-shitlist form (after the warning dialogue).
export function activateShitListAddForm() {
  const select = document.getElementById("shitlist-category-select");
  select.innerHTML = "";

  const categories = categoriesStore.data;
  for (const key in categories) {
    const category = categories[key];
    // Faction-ban categories can't be submitted from a profile
    if (category.isFactionBan) {
      continue;
    }
    const option = document.createElement("option");
    option.value = category.entryId;
    option.text = category.name;
    select.appendChild(option);
  }

  setShitListCategoryDescription(select.value);

  select.addEventListener("change", function () {
    setShitListCategoryDescription(this.value);
  });

  const submit = document.getElementById("shitlist-add-submit");
  submit.addEventListener("click", () => submitShitlistEntry(submit));

  document.getElementById("shitlist-add-container").style.display = "block";
}

async function submitShitlistEntry(submit) {
  // Prevent double-click submissions
  if (submit.disabled) {
    return;
  }
  submit.disabled = true;
  submit.innerText = "Submitting...";

  const resetButton = () => {
    submit.disabled = false;
    submit.innerText = "Submit to Shitlist";
  };

  const selectedCategoryId = document.getElementById(
    "shitlist-category-select",
  ).value;
  const reason = document.getElementById("shitlist-category-reason").value;
  const errorElm = document.getElementById("shitlist-add-error");

  if (!selectedCategoryId || !reason || reason.trim() === "") {
    errorElm.innerText =
      "Please ensure you select a category and provide a reason/explanation for the shitlisting";
    resetButton();
    return;
  }
  errorElm.innerText = "";

  try {
    await api("/shit-lists", {
      method: "POST",
      data: {
        playerName: getPlayerName(),
        playerId: getPlayerId(),
        reporterPlayerName: getUserscriptUsersPlayerName(),
        reporterPlayerId: getUserscriptUsersPlayerId(),
        shitListCategoryId: selectedCategoryId,
        reason: reason,
      },
    });

    LogInfo("Shitlist entry successfully submitted.");
    // Hide the form, show the success message
    document.getElementById("shitlist-add-container").style.display = "none";
    document.getElementById("shitlist-add-success").style.display = "block";

    // Also hide the "Add to Shitlist" button to prevent another submission
    const addButton = document.querySelector(".nfh-add-to-shitlist");
    if (addButton) {
      addButton.style.display = "none";
    }

    // Update the shitlist so that the user has the new addition
    shitlistStore.refresh();
  } catch (error) {
    const serverMessage = (error && error.body && error.body.message) || "";
    LogInfo("Failed to submit shitlist entry: " + serverMessage);
    // innerText is safe against HTML injection from the server message
    errorElm.innerText =
      "There was an error submitting your shitlisting. Please contact Fogest for help if this persists." +
      serverMessage;
    resetButton();
  }
}
