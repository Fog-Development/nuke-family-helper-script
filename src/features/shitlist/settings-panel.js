import { SettingsManager } from "../../core/settings.js";
import { categoriesStore } from "./data.js";
import { renderShitList } from "./render.js";
import { checkAndInsertReputation } from "../reputation.js";

// The floating settings panel (category visibility + reputation toggle),
// opened from the cog in the shitlist section header.
export function createSettingsPanel() {
  const panel = document.createElement("div");
  panel.classList.add("nfh-settings-panel");
  panel.style.display = "none";

  const title = document.createElement("div");
  title.classList.add("nfh-settings-title");
  title.textContent = "Shitlist Settings";

  const categoryList = document.createElement("div");
  categoryList.classList.add("nfh-category-list");

  // Add category toggles
  const categories = categoriesStore.data;
  for (const categoryId in categories) {
    const category = categories[categoryId];
    const categoryItem = document.createElement("div");
    categoryItem.classList.add("nfh-category-item");

    if (category.isFactionBan) {
      categoryItem.classList.add("faction-locked");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = SettingsManager.isCategoryVisible(
      categoryId,
      category.isFactionBan,
    );
    checkbox.disabled = category.isFactionBan;
    checkbox.dataset.categoryId = categoryId;

    checkbox.addEventListener("change", function () {
      SettingsManager.toggleCategory(categoryId, this.checked);
      renderShitList();
    });

    const label = document.createElement("span");
    label.textContent = category.name;

    categoryItem.appendChild(checkbox);
    categoryItem.appendChild(label);
    categoryList.appendChild(categoryItem);
  }

  // Reputation visibility toggle
  const reputationSection = document.createElement("div");
  reputationSection.classList.add("nfh-category-list");
  reputationSection.style.marginTop = "10px";
  reputationSection.style.borderTop = "1px solid var(--nfh-border)";
  reputationSection.style.paddingTop = "8px";

  const reputationSectionTitle = document.createElement("div");
  reputationSectionTitle.classList.add("nfh-settings-title");
  reputationSectionTitle.style.marginBottom = "6px";
  reputationSectionTitle.textContent = "Reputation Settings";

  const reputationItem = document.createElement("div");
  reputationItem.classList.add("nfh-category-item");

  const reputationCheckbox = document.createElement("input");
  reputationCheckbox.type = "checkbox";
  reputationCheckbox.checked = SettingsManager.isReputationVisible();
  reputationCheckbox.addEventListener("change", function () {
    SettingsManager.setReputationVisible(this.checked);
    const existing = document.querySelector(".nfh-reputation");
    if (this.checked) {
      if (!existing) {
        checkAndInsertReputation();
      }
    } else {
      if (existing) {
        existing.remove();
      }
    }
  });

  const reputationLabel = document.createElement("span");
  reputationLabel.textContent = "Show Reputation box on profiles";

  reputationItem.appendChild(reputationCheckbox);
  reputationItem.appendChild(reputationLabel);
  reputationSection.appendChild(reputationSectionTitle);
  reputationSection.appendChild(reputationItem);

  const closeButton = document.createElement("button");
  closeButton.classList.add("nfh-close-settings");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", function () {
    panel.style.display = "none";
  });

  panel.appendChild(title);
  panel.appendChild(categoryList);
  panel.appendChild(reputationSection);
  panel.appendChild(closeButton);

  return panel;
}
