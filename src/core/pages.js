import { TOKEN_GENERATION_URL } from "./config.js";

export const PageType = {
  Profile: "Profile",
  RecruitCitizens: "Recruit Citizens",
  HallOfFame: "Hall Of Fame",
  Faction: "Faction",
  FactionArmouryDrug: "Faction Armoury Drugs",
  Company: "Company",
  Competition: "Competition",
  Bounty: "Bounty",
  Search: "Search",
  Hospital: "Hospital",
  Chain: "Chain",
  FactionControl: "Faction Control",
  FactionControlPayday: "Faction Control Per Day",
  FactionControlApplications: "Faction Control Applications",
  Market: "Market",
  Forum: "Forum",
  ForumThread: "ForumThread",
  ForumSearch: "ForumSearch",
  Abroad: "Abroad",
  Enemies: "Enemies",
  Friends: "Friends",
  PointMarket: "Point Market",
  Properties: "Properties",
  War: "War",
  ChainReport: "ChainReport",
  RWReport: "RWReport",
  NukeFamily3rdParty: "NukeFamily3rdParty",
};

// Pages identified by a URL prefix.
const mapPageTypeAddress = {
  [PageType.Profile]: "https://www.torn.com/profiles.php",
  [PageType.RecruitCitizens]: "https://www.torn.com/bringafriend.php",
  [PageType.HallOfFame]: "https://www.torn.com/halloffame.php",
  [PageType.Faction]: "https://www.torn.com/factions.php",
  [PageType.Company]: "https://www.torn.com/joblist.php",
  [PageType.Competition]: "https://www.torn.com/competition.php",
  [PageType.Bounty]: "https://www.torn.com/bounties.php",
  [PageType.Search]: "https://www.torn.com/page.php",
  [PageType.Hospital]: "https://www.torn.com/hospitalview.php",
  [PageType.Chain]: "https://www.torn.com/factions.php?step=your#/war/chain",
  [PageType.Market]: "https://www.torn.com/imarket.php",
  [PageType.Forum]: "https://www.torn.com/forums.php",
  [PageType.ForumThread]: "https://www.torn.com/forums.php#/p=threads",
  [PageType.ForumSearch]: "https://www.torn.com/forums.php#/p=search",
  [PageType.Abroad]: "https://www.torn.com/index.php?page=people",
  [PageType.Enemies]: "https://www.torn.com/blacklist.php",
  [PageType.Friends]: "https://www.torn.com/friendlist.php",
  [PageType.PointMarket]: "https://www.torn.com/pmarket.php",
  [PageType.Properties]: "https://www.torn.com/properties.php",
  [PageType.War]: "https://www.torn.com/war.php",
  [PageType.ChainReport]: "https://www.torn.com/war.php?step=chainreport",
  [PageType.RWReport]: "https://www.torn.com/war.php?step=rankreport",
  [PageType.NukeFamily3rdParty]: TOKEN_GENERATION_URL,
};

// Pages identified by a URL fragment (checked with String.includes). These
// take precedence over the prefix map so that e.g. the armoury drugs tab can
// be distinguished from the generic faction page.
const mapPageAddressFragment = {
  [PageType.FactionControl]: "/tab=controls",
  [PageType.FactionArmouryDrug]: "tab=armoury&start=0&sub=drugs",
  [PageType.FactionControlPayday]: "tab=controls&option=pay-day",
  [PageType.FactionControlApplications]: "tab=controls&option=application",
};

export function IsPage(pageType) {
  const fragment = mapPageAddressFragment[pageType];
  if (fragment !== undefined) {
    return window.location.href.includes(fragment);
  }

  const prefix = mapPageTypeAddress[pageType];
  if (prefix !== undefined) {
    return window.location.href.startsWith(prefix);
  }
  return false;
}

// Torn is a mix of full page loads and SPA-style hash navigation (e.g. the
// faction page switches tabs by changing the location hash). Subscribe to all
// the ways the URL can change so features can be (re-)dispatched on
// navigation without a document-wide MutationObserver. The callback only
// fires when the URL actually changed, so overlapping signals (hashchange +
// the poller) don't double-fire. The low-frequency poll is a safety net for
// history calls the wrappers can't see (some userscript sandboxes hand the
// script a different history object than the page's).
export function onNavigate(callback) {
  let lastHref = window.location.href;
  const fireIfChanged = () => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href;
      callback();
    }
  };

  window.addEventListener("hashchange", fireIfChanged);
  window.addEventListener("popstate", fireIfChanged);
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method].bind(history);
    history[method] = (...args) => {
      const result = original(...args);
      fireIfChanged();
      return result;
    };
  }
  setInterval(fireIfChanged, 500);
}
