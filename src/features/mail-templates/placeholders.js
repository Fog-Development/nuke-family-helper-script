// Placeholders in mail templates: `{name}` and friends are swapped for the
// recipient's or sender's details when a template is put into the editor.
// Pure (no DOM), so it is unit tested.

export const PLACEHOLDERS = [
  { key: "name", label: "the recipient's name", where: "messages" },
  { key: "id", label: "the recipient's player ID", where: "messages" },
  { key: "me", label: "your name" },
  { key: "myid", label: "your player ID" },
  { key: "date", label: "today's date in Torn time, e.g. 13/11/26" },
  { key: "time", label: "the Torn time now, e.g. 18:05" },
];

const KNOWN = new Set(PLACEHOLDERS.map((placeholder) => placeholder.key));
const PATTERN = /\{(\w+)\}/g;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Torn time is UTC.
export function tornDate(now = new Date()) {
  const two = (n) => String(n).padStart(2, "0");
  return {
    date: `${two(now.getUTCDate())}/${two(now.getUTCMonth() + 1)}/${two(now.getUTCFullYear() % 100)}`,
    time: `${two(now.getUTCHours())}:${two(now.getUTCMinutes())}`,
  };
}

// "Fogest [2254826]" (Torn's recipient box after picking a name) → parts.
export function parseRecipient(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(.*?)\s*\[(\d+)\]\s*$/);
  if (match) return { name: match[1].trim() || null, id: match[2] };
  if (/^\d+$/.test(text)) return { name: null, id: text };
  return { name: text || null, id: null };
}

// Swap every known placeholder that has a value. `values` maps keys to text;
// a known placeholder without a value is left as it is and named in `missing`,
// so the member can see what still needs filling in. Unknown `{words}` are
// not placeholders and are left alone. With `html`, values are escaped.
export function fill(text, values, { html = false } = {}) {
  const missing = new Set();
  const out = String(text ?? "").replace(PATTERN, (whole, key) => {
    const lower = key.toLowerCase();
    if (!KNOWN.has(lower)) return whole;
    const value = values[lower];
    if (value === null || value === undefined || value === "") {
      missing.add(lower);
      return whole;
    }
    return html ? escapeHtml(value) : String(value);
  });
  return { text: out, missing: [...missing] };
}

// Which known placeholders a text uses (for the save form's hint).
export function placeholdersIn(text) {
  const found = new Set();
  for (const match of String(text ?? "").matchAll(PATTERN)) {
    if (KNOWN.has(match[1].toLowerCase())) found.add(match[1].toLowerCase());
  }
  return [...found];
}
