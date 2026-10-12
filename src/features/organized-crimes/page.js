// Reads Torn's organized crimes page. Torn's class names carry a build hash
// ("slotHeader___oD218"), so everything is matched on the stable prefix.

export const CRIMES_ROOT_SELECTOR = "#faction-crimes-root";

export const SubTab = {
  Recruiting: "recruiting",
  Planning: "planning",
  Completed: "completed",
};

// Which of the crimes page's sub-tabs is showing, or null if it cannot be
// told (the page is still loading).
export function activeSubTab(root) {
  for (const name of root.querySelectorAll('[class^="tabName___"]')) {
    const button = name.closest("button");
    if (button && /(^|\s)active___/.test(button.className)) {
      return name.textContent.trim().toLowerCase();
    }
  }
  return null;
}

// How far through their 24 hours of planning a slot's member is (0 to 1).
// Torn draws it as a clock: a conic gradient filled to N degrees.
function planningProgress(slotEl) {
  const clock = slotEl.querySelector('[class^="slotIcon___"] [class^="planning___"]');
  if (!clock) return 0;
  const match = /conic-gradient\([^,]*?([\d.]+)deg/.exec(clock.getAttribute("style") || "");
  if (!match) return 0;
  return Math.min(1, Math.max(0, parseFloat(match[1]) / 360));
}

function readSlot(headerEl) {
  const titleEl = headerEl.querySelector('[class^="title___"]');
  if (!titleEl) return null;

  const el = headerEl.parentElement;
  const chanceEl = headerEl.querySelector('[class^="successChance___"]');
  const cpr = chanceEl ? parseFloat(chanceEl.textContent) : NaN;
  const occupied = !!el.querySelector('[class^="badge___"]');
  const joinButton = el.querySelector('button[class*="joinButton___"]');
  const profile = occupied ? el.querySelector('a[href*="profiles.php?XID="]') : null;
  const playerId = profile ? /XID=(\d+)/.exec(profile.getAttribute("href")) : null;

  return {
    el,
    headerEl,
    titleEl,
    name: titleEl.textContent.trim(),
    // On an empty slot this is the viewer's own CPR for the role; on a filled
    // one it is the occupant's.
    cpr: Number.isNaN(cpr) ? null : cpr,
    occupied,
    playerId: playerId ? playerId[1] : null,
    progress: occupied ? planningProgress(el) : 0,
    joinButton,
  };
}

// The crime name without anything a script (ours or another) appended to the
// title element.
function crimeName(crimeEl) {
  const titleEl = crimeEl.querySelector('[class^="panelTitle___"]');
  if (!titleEl) return null;
  let name = "";
  for (const node of titleEl.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) name += node.textContent;
  }
  return name.trim() || null;
}

// Every crime currently in the DOM. Torn lazy-loads the list, so this is
// only the part the member has scrolled to. Slots come in Torn's order:
// members in the order they joined, then the empty slots.
export function readCrimes(root) {
  const crimes = [];
  for (const el of root.querySelectorAll("[data-oc-id]")) {
    const name = crimeName(el);
    if (!name) continue;

    const levelEl = el.querySelector('[class^="levelValue___"]');
    const slots = [];
    for (const headerEl of el.querySelectorAll('button[class^="slotHeader___"]')) {
      const slot = readSlot(headerEl);
      if (slot) slots.push(slot);
    }

    crimes.push({
      id: el.getAttribute("data-oc-id"),
      el,
      name,
      level: levelEl ? parseInt(levelEl.textContent, 10) || null : null,
      slots,
    });
  }
  return crimes;
}

export const JoinState = {
  Open: "open", // at least one slot can be joined
  Blocked: "blocked", // there are open slots, but Torn has every Join button disabled
  Full: "full", // no open slot is loaded
};

// Whether Torn is offering the member a slot at all. Every Join button is
// disabled while they already sit in a crime.
export function joinState(crimes) {
  const buttons = crimes.flatMap((crime) =>
    crime.slots.map((slot) => slot.joinButton).filter(Boolean),
  );
  if (buttons.length === 0) return JoinState.Full;
  return buttons.some((button) => !button.disabled) ? JoinState.Open : JoinState.Blocked;
}
