// The pure rules of the ranked war board: what a member's row should say and
// where it belongs in the list. Unit tested in test/unit/, so this must not
// import anything that needs the browser or the build defines.
//
// Two sources describe a member. Torn's own status cell is live but only says
// "Hospital" or "Traveling"; the site's copy of Torn's API (a few seconds old)
// says until when and where to. They disagree for a few seconds after someone
// is hospitalised, revived or lands, and the page is always the newer one.

// Sort groups, in the order a status sort lists them.
export const Group = {
  Out: 0, // the page says okay while the API still has them in hospital or flying
  Okay: 1,
  Hospital: 2,
  Incoming: 3, // flying back to Torn
  Abroad: 4,
  Outgoing: 5,
  Traveling: 6,
  Away: 7, // federal jail, fallen
};

export const SortMode = {
  Off: "off",
  Status: "status",
  StatsAsc: "stats-asc",
  StatsDesc: "stats-desc",
};

// How members with the same status are ordered among themselves.
export const Then = {
  StatsAsc: "stats-asc",
  StatsDesc: "stats-desc",
  ScoreDesc: "score-desc",
  ScoreAsc: "score-asc",
  Recent: "recent", // whoever became okay most recently first
};

// A hospital stay ending within this many seconds is worth getting ready for.
export const SOON_SECONDS = 300;
// How long a member who left hospital early stays highlighted.
export const OUT_HIGHLIGHT_MS = 10000;
// The API's "until" may run out a moment before the page catches up.
const EXPIRY_TOLERANCE_SECONDS = 2;

const PLACE_CODES = {
  mexico: "MX",
  "cayman islands": "CI",
  canada: "CA",
  hawaii: "HI",
  "united kingdom": "UK",
  argentina: "AR",
  switzerland: "SW",
  japan: "JP",
  china: "CN",
  uae: "UAE",
  "south africa": "SA",
  torn: "TC",
};

function placeCode(place) {
  const name = String(place).trim();
  return PLACE_CODES[name.toLowerCase()] || name;
}

// { from, to } as short codes, or null for a description that is not a flight.
export function parseRoute(description) {
  const text = String(description || "");
  let match = text.match(/^Traveling from (.+) to (.+)$/);
  if (match) return { from: placeCode(match[1]), to: placeCode(match[2]) };
  match = text.match(/^Returning to Torn from (.+)$/);
  if (match) return { from: placeCode(match[1]), to: "TC" };
  match = text.match(/^Traveling to (.+)$/);
  if (match) return { from: "TC", to: placeCode(match[1]) };
  return null;
}

// 3725 -> "1:02:05", 185 -> "3:05"
export function formatCountdown(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}

// 2500000000 -> "2.5b"
export function formatStats(total) {
  const units = [
    [1e12, "t"],
    [1e9, "b"],
    [1e6, "m"],
    [1e3, "k"],
  ];
  for (const [size, suffix] of units) {
    if (total >= size) {
      const value = total / size;
      return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10}${suffix}`;
    }
  }
  return String(Math.round(total));
}

// "4.3b" -> 4300000000, as BSP and FF Scouter write estimates on the page.
// Null for anything that is not a number ("N/A", a spinner, an empty box).
export function parseStatText(text) {
  const match = String(text || "").trim().match(/^([\d.,]+)\s*([kmbtq])?$/i);
  if (!match) return null;
  const scale = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 }[(match[2] || "").toLowerCase()] || 1;
  const value = Number(match[1].replace(/,/g, "")) * scale;
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

// Where a stat estimate can come from: the two scripts members run.
export const Source = { Bsp: "bsp", FfScouter: "ffscouter" };
export const SOURCES = [Source.Bsp, Source.FfScouter];

// The estimate to use for a row: what the member's own BSP or FF Scouter shows
// on the page if either does, else what nuke.family holds from other members.
// The preferred source wins within each. Returns { total, source, fromPage },
// with total 0 when nobody has an estimate.
export function pickEstimate(onPage, held, preferred) {
  const order = [preferred, ...SOURCES.filter((source) => source !== preferred)];
  for (const [values, fromPage] of [[onPage, true], [held, false]]) {
    for (const source of order) {
      if (values && values[source] > 0) return { total: values[source], source, fromPage };
    }
  }
  return { total: 0, source: null, fromPage: false };
}

// What one row should show.
//
//   member   { s: state, u: until (unix seconds), d: description } from the
//            site, or undefined when the site has nothing for this player
//   pageKind what Torn's status cell says: "okay" | "hospital" | "travel" | "other"
//   memo     { outSince, okaySince } (ms) remembered for this player between
//            calls; pass {} the first time
//
// Returns { group, label, until, soon, out, memo }. `label` replaces the
// status cell's text when it is not null; `until` orders the hospital group.
export function classify(member, pageKind, nowMs, memo = {}) {
  const base = { label: null, until: 0, soon: false, out: false };
  const carried = { outSince: memo.outSince || 0, okaySince: memo.okaySince || 0 };
  const settled = { outSince: 0, okaySince: 0 };

  // Okay, as far as anyone can tell: whoever left hospital early stays "out"
  // (and highlighted for a moment) until the API agrees.
  const okay = (next) => ({
    ...base,
    group: next.outSince ? Group.Out : Group.Okay,
    out: !!next.outSince && nowMs - next.outSince < OUT_HIGHLIGHT_MS,
    memo: next,
  });

  if (!member) {
    if (pageKind === "hospital") return { ...base, group: Group.Hospital, memo: settled };
    if (pageKind === "travel") return { ...base, group: Group.Traveling, memo: settled };
    return okay(carried);
  }

  if (member.s === "Hospital" || member.s === "Jail") {
    const remaining = member.u - nowMs / 1000;
    if (pageKind === "hospital") {
      return {
        ...base,
        group: Group.Hospital,
        label: remaining > 0 ? formatCountdown(remaining) : null,
        until: member.u,
        soon: remaining > 0 && remaining < SOON_SECONDS,
        memo: settled,
      };
    }
    if (pageKind === "okay" && remaining > EXPIRY_TOLERANCE_SECONDS) {
      // Revived, or took a med: out before the API noticed.
      return okay({ outSince: carried.outSince || nowMs, okaySince: carried.okaySince || nowMs });
    }
    return okay({ outSince: 0, okaySince: carried.okaySince || member.u * 1000 });
  }

  if (member.s === "Traveling" || member.s === "Abroad") {
    if (pageKind === "okay") {
      // Landed before the API noticed.
      return okay({ outSince: carried.outSince || nowMs, okaySince: carried.okaySince || nowMs });
    }
    if (pageKind !== "travel") return okay(carried);

    const abroad = String(member.d || "").match(/^In (.+)$/);
    if (abroad) {
      return { ...base, group: Group.Abroad, label: placeCode(abroad[1]), memo: settled };
    }
    const route = parseRoute(member.d);
    if (route && route.to === "TC") {
      return { ...base, group: Group.Incoming, label: `◄ ${route.from}`, memo: settled };
    }
    if (route) {
      return { ...base, group: Group.Outgoing, label: `► ${route.to}`, memo: settled };
    }
    return { ...base, group: Group.Traveling, memo: settled };
  }

  if (member.s !== "Okay") {
    return { ...base, group: Group.Away, memo: settled };
  }

  // The API says okay. The page knows sooner when that stopped being true.
  if (pageKind === "hospital") return { ...base, group: Group.Hospital, memo: settled };
  if (pageKind === "travel") return { ...base, group: Group.Traveling, memo: settled };
  return okay({ outSince: 0, okaySince: carried.okaySince });
}

// Order two rows of the same status by the member's choice. Rows without a
// stat estimate come after the ones with, whichever way stats are sorted.
function compareThen(a, b, then) {
  switch (then) {
    case Then.StatsAsc:
      return (a.stats || Infinity) - (b.stats || Infinity);
    case Then.StatsDesc:
      return (b.stats || 0) - (a.stats || 0);
    case Then.ScoreDesc:
      return (b.score || 0) - (a.score || 0);
    case Then.ScoreAsc:
      return (a.score || 0) - (b.score || 0);
    default:
      return (b.memo.okaySince || 0) - (a.memo.okaySince || 0);
  }
}

// Order two rows by status: who can be hit now (just out of hospital first),
// then who leaves hospital next, then the travellers. `then` orders the
// members who are okay, and breaks ties everywhere else.
export function compareStatus(a, b, then = Then.ScoreDesc) {
  if (a.group !== b.group) return a.group - b.group;
  let order = 0;
  switch (a.group) {
    case Group.Out:
      order = b.memo.outSince - a.memo.outSince;
      break;
    case Group.Okay:
      break;
    case Group.Hospital:
      order = (a.until || Infinity) - (b.until || Infinity);
      break;
    default:
      order = String(a.label || "").localeCompare(String(b.label || ""));
  }
  // Infinity - Infinity (two hospital rows with no time yet) is not a tie-break.
  return order || compareThen(a, b, then) || 0;
}

// The comparator for a sort mode, or null when the list is left as Torn has
// it. Rows without a stat estimate come after the ones with, by status.
export function comparatorFor(mode, then = Then.ScoreDesc) {
  const byStatus = (a, b) => compareStatus(a, b, then);
  if (mode === SortMode.Status) return byStatus;
  if (mode !== SortMode.StatsAsc && mode !== SortMode.StatsDesc) return null;

  const direction = mode === SortMode.StatsAsc ? 1 : -1;
  return (a, b) => {
    if (a.stats && b.stats) {
      return a.stats === b.stats ? byStatus(a, b) : direction * (a.stats - b.stats);
    }
    if (a.stats || b.stats) return a.stats ? -1 : 1;
    return byStatus(a, b);
  };
}
