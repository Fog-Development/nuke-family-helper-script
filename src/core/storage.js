// Where the script keeps what must not be lost: the nuke.family key and the
// member's own settings.
//
// In a browser these live where they always have: the key in the userscript
// manager's storage (GM_getValue), settings in localStorage. Nothing changes
// there.
//
// In TornPDA the "GM" storage is really the page's localStorage, which the
// app can evict and a cache clear wipes, taking the key with it. TornPDA's own
// per-script store (`PDA_storage`, kept by the app in SQLite) does not have
// that problem, so when it exists it becomes the source of truth:
//
//   - it is async, so `initStorage()` reads all of it once into memory before
//     anything else runs, and reads stay synchronous;
//   - every write still goes to the old place too. That copy is what an older
//     version of the script reads, and what this one falls back on when the
//     app's store cannot be read;
//   - a value only the old place has is copied across the first time (this is
//     the migration: nothing for the member to do), and one only the app has,
//     after a cache clear, is put back in the old place;
//   - a write the app did not confirm is remembered (`UNSAVED_KEY`), so the
//     old place's newer value wins next time instead of being overwritten.
//
// Big re-fetchable caches (shitlist, contracts, OC config) are deliberately
// not here: they cost nothing to lose and would cross the app bridge on every
// page load.

// Kept in the userscript manager's storage. Any JSON value.
const MANAGER_KEYS = ["apiToken", "apiTokenFirstTime", "nfhTokenReturnUrl", "nfhConnectPending"];

// Kept in localStorage, as the strings the script has always stored there.
const LOCAL_KEYS = [
  "hiddenShitlistCategories",
  "nfhShowReputation",
  "nfhChainWatch",
  "nfhRankedWar",
  "nfhOcStaffPrefs",
];

const UNSAVED_KEY = "nfhNativeStorageUnsaved";
const LOAD_TIMEOUT_MS = 3000;

let native = null;
let mirror = {};
const info = { backend: "default", present: false, migrated: [], restored: [], error: null, write_error: null };

function nativeStore() {
  try {
    // A bare global the app injects into the script's scope, not always a
    // property of window.
    const store = typeof PDA_storage !== "undefined" ? PDA_storage : null;
    return store && typeof store.loadAll === "function" && typeof store.setMany === "function" ? store : null;
  } catch (e) {
    return null;
  }
}

export function hasNativeStorage() {
  return nativeStore() !== null;
}

function isManagerKey(key) {
  return MANAGER_KEYS.includes(key);
}

// The old place: undefined when the key is not there.
function legacyRead(key) {
  try {
    if (isManagerKey(key)) return GM_getValue(key, undefined);
    const value = localStorage.getItem(key);
    return value === null ? undefined : value;
  } catch (e) {
    return undefined;
  }
}

function legacyWrite(key, value) {
  try {
    if (isManagerKey(key)) GM_setValue(key, value);
    else localStorage.setItem(key, value);
  } catch (e) {
    // Full or unavailable: the app's store, when there is one, still has it.
  }
}

function unsavedKeys() {
  try {
    const keys = JSON.parse(localStorage.getItem(UNSAVED_KEY) || "[]");
    return Array.isArray(keys) ? keys : [];
  } catch (e) {
    return [];
  }
}

function setUnsaved(keys) {
  try {
    if (keys.length === 0) localStorage.removeItem(UNSAVED_KEY);
    else localStorage.setItem(UNSAVED_KEY, JSON.stringify(keys));
  } catch (e) {
    // Nothing to be done.
  }
}

// Write to the app's store. The keys are marked unsaved first and cleared
// once the app confirms, so a write that fails, or never finishes because the
// page went away, is not mistaken for a saved one.
function push(pairs) {
  const keys = Object.keys(pairs);
  if (!native || keys.length === 0) return Promise.resolve();

  setUnsaved([...new Set([...unsavedKeys(), ...keys])]);
  return Promise.resolve()
    .then(() => native.setMany(pairs))
    .then(() => {
      setUnsaved(unsavedKeys().filter((key) => !keys.includes(key)));
      info.write_error = null;
    })
    .catch((error) => {
      info.write_error = String((error && (error.code || error.message)) || error);
    });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Load the app's store, if there is one, and bring the two places into line.
// Never rejects: on any trouble the script carries on with the old place.
//
// `migrate: false` only reads. It is for nuke.family's token page, whose own
// localStorage has nothing to do with the member's Torn-side data.
export async function initStorage({ migrate = true } = {}) {
  const store = nativeStore();
  info.present = store !== null;
  if (!store) return;

  let stored;
  try {
    stored = (await withTimeout(store.loadAll(), LOAD_TIMEOUT_MS)) || {};
  } catch (error) {
    info.error = String((error && error.message) || error);
    return;
  }

  native = store;
  mirror = {};
  info.backend = "pda_storage";
  const unsaved = migrate ? unsavedKeys() : [];
  const toPush = {};

  for (const key of [...MANAGER_KEYS, ...LOCAL_KEYS]) {
    const inApp = stored[key] !== undefined && stored[key] !== null;
    const old = migrate ? legacyRead(key) : undefined;

    if (old !== undefined && (!inApp || unsaved.includes(key))) {
      mirror[key] = old;
      if (!inApp || !same(stored[key], old)) {
        toPush[key] = old;
        info.migrated.push(key);
      }
    } else if (inApp) {
      mirror[key] = stored[key];
      if (migrate && !same(old, stored[key])) {
        legacyWrite(key, stored[key]);
        info.restored.push(key);
      }
    }
  }

  if (Object.keys(toPush).length > 0) await push(toPush);
  else if (unsaved.length > 0) setUnsaved([]);
}

function read(key, fallback) {
  if (native) return key in mirror ? mirror[key] : fallback;
  const value = legacyRead(key);
  return value === undefined ? fallback : value;
}

function write(key, value) {
  legacyWrite(key, value);
  if (native) {
    mirror[key] = value;
    push({ [key]: value });
  }
}

// The userscript manager's values (the key and the first-run flags).
export function getValue(key, fallback) {
  return read(key, fallback);
}

export function setValue(key, value) {
  write(key, value);
}

// Settings, with localStorage's own shape: a string, or null when unset.
export function getItem(key) {
  const value = read(key, null);
  return value === null || value === undefined ? null : String(value);
}

export function setItem(key, value) {
  write(key, String(value));
}

// For the debug report: which store is in use and what happened on the way.
// Key names only, never values.
export async function storageInfo() {
  const report = {
    ...info,
    keys: native ? Object.keys(mirror) : undefined,
    unsaved: info.present ? unsavedKeys() : undefined,
  };
  if (native && typeof native.usage === "function") {
    try {
      report.usage = await withTimeout(native.usage(), LOAD_TIMEOUT_MS);
    } catch (e) {
      report.usage = null;
    }
  }
  return report;
}
