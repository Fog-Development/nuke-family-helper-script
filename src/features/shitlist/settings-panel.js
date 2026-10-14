import { SettingsManager } from "../../core/settings.js";
import { categoriesStore } from "./data.js";
import { renderShitList } from "./render.js";
import { applyReputationSetting } from "../reputation.js";
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

  const reputationSection = buildReputationSection(panel);
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

const REPUTATION_LOCKED_REASON =
  "You can check recruiting scores, so this always shows: the Check Recruiting Score button is in this box.";

// The reputation box toggle. On by default in a reviving faction, off outside
// one; on and locked for a member who may check recruiting scores.
function buildReputationSection(panel) {
  return buildLockableSection(panel, {
    title: "Reputation Settings",
    label: "Show Reputation box on profiles",
    itemClass: "nfh-reputation-setting",
    lockedReason: REPUTATION_LOCKED_REASON,
    isLocked: SettingsManager.isReputationLocked,
    isVisible: SettingsManager.isReputationVisible,
    setVisible: SettingsManager.setReputationVisible,
    apply: applyReputationSetting,
  });
}

const CONTRACT_LOCKED_REASON =
  "Your faction revives, so this always shows: it tells you whether a revive on this player is paid.";

// The "Active Contract" box toggle. Off by default outside a reviving faction;
// inside one it is on and cannot be turned off.
function buildContractSection(panel) {
  return buildLockableSection(panel, {
    title: "Contract Settings",
    label: "Show Active Contract box on profiles",
    itemClass: "nfh-contract-setting",
    lockedReason: CONTRACT_LOCKED_REASON,
    isLocked: SettingsManager.isActiveContractLocked,
    isVisible: SettingsManager.isActiveContractVisible,
    setVisible: SettingsManager.setActiveContractVisible,
    apply: applyActiveContractSetting,
  });
}

// A section with one checkbox that the member's faction or permissions can
// lock on, showing why on hover and in a note beneath it.
function buildLockableSection(panel, options) {
  const section = document.createElement("div");
  section.classList.add("nfh-category-list");
  section.style.marginTop = "10px";
  section.style.borderTop = "1px solid var(--nfh-border)";
  section.style.paddingTop = "8px";

  const sectionTitle = document.createElement("div");
  sectionTitle.classList.add("nfh-settings-title");
  sectionTitle.style.marginBottom = "6px";
  sectionTitle.textContent = options.title;

  const item = document.createElement("label");
  item.classList.add("nfh-category-item", options.itemClass);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const label = document.createElement("span");
  label.textContent = options.label;

  const note = document.createElement("div");
  note.classList.add("nfh-setting-note");
  note.textContent = options.lockedReason;

  // Read again each time the panel opens: the member's faction and
  // permissions are fetched in the background and may arrive after the panel
  // was built.
  const sync = () => {
    const locked = options.isLocked();
    checkbox.checked = options.isVisible();
    checkbox.disabled = locked;
    item.classList.toggle("nfh-setting-locked", locked);
    item.title = locked ? options.lockedReason : "";
    note.style.display = locked ? "" : "none";
  };
  sync();
  panel.addEventListener("nfh-settings-open", sync);

  checkbox.addEventListener("change", function () {
    options.setVisible(this.checked);
    options.apply();
  });

  item.appendChild(checkbox);
  item.appendChild(label);
  section.appendChild(sectionTitle);
  section.appendChild(item);
  section.appendChild(note);
  return section;
}
