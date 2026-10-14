import { SettingsManager } from "../../core/settings.js";
import { categoriesStore } from "./data.js";
import { renderShitList } from "./render.js";
import { checkAndInsertReputation } from "../reputation.js";
import { applyActiveContractSetting } from "../contracts.js";

// The floating settings panel (category visibility, reputation and active
// contract toggles), opened from the cog in the shitlist section header. It
// hears "nfh-settings-open" each time it is shown.
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

  const contractSection = buildContractSection(panel);

  const closeButton = document.createElement("button");
  closeButton.classList.add("nfh-close-settings");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", function () {
    panel.style.display = "none";
  });

  panel.appendChild(title);
  panel.appendChild(categoryList);
  panel.appendChild(reputationSection);
  panel.appendChild(contractSection);
  panel.appendChild(closeButton);

  return panel;
}

const CONTRACT_LOCKED_REASON =
  "Your faction revives, so this always shows: it tells you whether a revive on this player is paid.";

// The "Active Contract" box toggle. Off by default outside a reviving faction;
// inside one it is on and cannot be turned off.
function buildContractSection(panel) {
  const section = document.createElement("div");
  section.classList.add("nfh-category-list");
  section.style.marginTop = "10px";
  section.style.borderTop = "1px solid var(--nfh-border)";
  section.style.paddingTop = "8px";

  const sectionTitle = document.createElement("div");
  sectionTitle.classList.add("nfh-settings-title");
  sectionTitle.style.marginBottom = "6px";
  sectionTitle.textContent = "Contract Settings";

  const item = document.createElement("label");
  item.classList.add("nfh-category-item", "nfh-contract-setting");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const label = document.createElement("span");
  label.textContent = "Show Active Contract box on profiles";

  const note = document.createElement("div");
  note.classList.add("nfh-setting-note");
  note.textContent = CONTRACT_LOCKED_REASON;

  // Read again each time the panel opens: the member's faction is fetched in
  // the background and may arrive after the panel was built.
  const sync = () => {
    const locked = SettingsManager.isActiveContractLocked();
    checkbox.checked = SettingsManager.isActiveContractVisible();
    checkbox.disabled = locked;
    item.classList.toggle("nfh-setting-locked", locked);
    item.title = locked ? CONTRACT_LOCKED_REASON : "";
    note.style.display = locked ? "" : "none";
  };
  sync();
  panel.addEventListener("nfh-settings-open", sync);

  checkbox.addEventListener("change", function () {
    SettingsManager.setActiveContractVisible(this.checked);
    applyActiveContractSetting();
  });

  item.appendChild(checkbox);
  item.appendChild(label);
  section.appendChild(sectionTitle);
  section.appendChild(item);
  section.appendChild(note);
  return section;
}
