// Reading the faction armoury tabs the member has open (Torn draws each sub-tab
// into `[id="tab=armoury&sub=<tab>"]` once it has been opened, and keeps it).
// Every row is an `li` with `.img-wrap[data-itemid][data-armoryid]`, a `.type`
// cell (what Torn's loan action calls the item type), a `.loaned` cell that is
// "Available" or links to the member holding it, and Give/Loan/Retrieve links.

export const tabSelector = (tab) => `[id="tab=armoury&sub=${tab}"]`;

// { tab: rows } for every sub-tab drawn on the page. A tab Torn drew as empty
// ("no items in this category") is read as an empty list: it is live too.
export function readArmoury(tabs) {
  const live = {};
  for (const tab of tabs) {
    const container = document.querySelector(tabSelector(tab));
    if (!container) continue;
    const rows = [...container.querySelectorAll("li .img-wrap[data-itemid]")].map((wrap) => readRow(wrap.closest("li"), wrap));
    const empty = !rows.length && /no items in this category/i.test(container.textContent);
    if (rows.length || empty) live[tab] = rows;
  }
  return live;
}

function readRow(li, wrap) {
  const link = li.querySelector('.loaned a[href*="profiles.php?XID="]');
  const holder = link ? Number(new URL(link.getAttribute("href"), location.origin).searchParams.get("XID")) : null;
  const name = (li.querySelector(".name")?.childNodes[0]?.textContent || li.querySelector(".name")?.textContent || "").replace(/\s+x?\s*$/, "").trim();
  return {
    li,
    itemId: Number(wrap.dataset.itemid),
    armoryId: wrap.dataset.armoryid,
    name,
    type: (li.querySelector(".type")?.textContent || "").trim(),
    loanedTo: holder || null,
    loanedName: link ? link.textContent.trim() : null,
    canLoan: !!li.querySelector('.item-action a.loan.active, .item-action [data-role="loan"].active'),
    hasBonus: !!li.querySelector(".bonuses, .item-bonuses, [class*='bonus-attachment']"),
  };
}

// Torn's Loan or Give box, when the member has opened one on a row: the row,
// which box, and its member field.
export function openActionBox(tab) {
  const container = document.querySelector(tabSelector(tab));
  if (!container) return null;
  const li = container.querySelector("li.item-loan-act, li.item-give-act");
  if (!li) return null;
  const kind = li.classList.contains("item-loan-act") ? "loan" : "give";
  const box = li.querySelector(`.${kind}-cont.action-cont`);
  const input = box?.querySelector('input[name="user"]');
  if (!box || !input) return null;
  return { li, kind, box, input, itemId: Number(box.dataset.itemid || li.querySelector(".img-wrap")?.dataset.itemid) };
}
