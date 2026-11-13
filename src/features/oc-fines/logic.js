// Pure rules for the OC fine form, banner and mail bar (no DOM, unit tested).
// The site decides everything that matters (who may fine, the ladder, the
// mail); this only picks what to show first.

// The staff flag on an OC slot (organized-crimes/flags.js) a fine reason
// follows from.
export const REASON_FOR_FLAG = {
  unqualified: "cpr_too_low",
  unproductive: "unproductive",
  underlevel: "cpr_too_high",
};

// The crime a reason should name in the form: the one the site suggests,
// else none. `context` is the site's /oc-fines/context answer.
export function defaultCrimeFor(context, reasonKey, presetCrimeId = null) {
  const reason = (context.reasons || []).find((r) => r.key === reasonKey);
  if (!reason || reason.crime === "never") return null;
  const crimes = context.crimes || [];
  if (presetCrimeId !== null && presetCrimeId !== undefined) {
    // A crime read off the page wins, even when the site has not seen this
    // member in it (they may just have been removed).
    return String(presetCrimeId);
  }
  if (reason.default_crime_id !== null && reason.default_crime_id !== undefined) {
    const known = crimes.some((c) => String(c.crime_id) === String(reason.default_crime_id));
    if (known) return String(reason.default_crime_id);
  }
  return null;
}

// The crime choices: the site's, plus one read off the page that the site
// does not list yet.
export function crimeChoices(context, preset = null) {
  const choices = (context.crimes || []).map((c) => ({ id: String(c.crime_id), label: c.label }));
  if (preset && preset.id && !choices.some((c) => c.id === String(preset.id))) {
    choices.unshift({ id: String(preset.id), label: `On this page · ${preset.label || "crime " + preset.id}` });
  }
  return choices;
}

// "Next: Strike 2 on the shared ladder: 10 points, expires 8 Dec 2026"
export function quoteLine(context, reasonKey) {
  const reason = (context.reasons || []).find((r) => r.key === reasonKey);
  return reason && reason.quote ? reason.quote.summary : "";
}

// What to say in the unpaid-fines banner, or null for nothing.
export function bannerText(mine) {
  const unpaid = (mine && mine.unpaid) || [];
  if (unpaid.length === 0) return null;
  const totals = {};
  for (const fine of unpaid) {
    totals[fine.currency] = (totals[fine.currency] || 0) + (fine.amount || 0);
  }
  const parts = Object.entries(totals).map(([currency, amount]) =>
    currency === "cash" ? `$${amount.toLocaleString("en-US")}` : `${amount.toLocaleString("en-US")} points`,
  );
  return `You owe ${parts.join(" and ")} in OC fines (${unpaid.length} unpaid).`;
}

// A short label for a fine in the mail bar: "Bob · 10 points · Delaying OC: travel".
export function fineChipLabel(fine) {
  return [fine.player_name || `[${fine.player_id}]`, fine.penalty, fine.reason].filter(Boolean).join(" · ");
}

// The recipient box value Torn's compose page expects: "Name [ID]".
export function recipientFor(fine) {
  return fine.player_name ? `${fine.player_name} [${fine.player_id}]` : String(fine.player_id);
}
