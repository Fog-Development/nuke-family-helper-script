// Entry point. The pda-polyfill import MUST stay first: it installs the GM_*
// APIs when running inside TornPDA, before any other module touches them.
import "./core/pda-polyfill.js";

import styles from "./styles.css";
import { initAuth } from "./core/auth.js";
import {
  checkCacheUpdates,
  registerSyncedStore,
} from "./core/cache-sync.js";
import { addStyle } from "./core/dom.js";
import { LogInfo } from "./core/log.js";
import { IsPage, onNavigate, PageType } from "./core/pages.js";
import { hasNativeStorage, initStorage } from "./core/storage.js";
import { checkForUpdates } from "./core/update-checker.js";

import chainWatch from "./features/chain-watch/index.js";
import { initConnect } from "./features/connect.js";
import contracts, { contractsStore } from "./features/contracts.js";
import factionButtons from "./features/faction-buttons.js";
import hospital from "./features/hospital.js";
import organizedCrimes from "./features/organized-crimes/index.js";
import { ocConfigStore } from "./features/organized-crimes/data.js";
import rankedWar from "./features/ranked-war/index.js";
import reputation from "./features/reputation.js";
import retals from "./features/retals/index.js";
import { categoriesStore, shitlistStore } from "./features/shitlist/data.js";
import shitlistProfile from "./features/shitlist/profile.js";
import { initTokenCapture } from "./features/token-capture.js";

// Every Torn page-scoped feature. A feature is { name, pages: [PageType],
// init() }; init() is called whenever its page matches (on load and on SPA
// navigation) and must therefore be idempotent. To add a new feature: create a
// module exporting such an object, list it here, and add a @match line in
// src/header.txt if it targets a new URL.
const features = [
  shitlistProfile,
  contracts,
  reputation,
  hospital,
  factionButtons,
  chainWatch,
  retals,
  rankedWar,
  organizedCrimes,
];

function dispatchFeatures() {
  for (const feature of features) {
    if (feature.pages.some((page) => IsPage(page))) {
      try {
        feature.init();
      } catch (error) {
        console.error(`[NFH] Feature "${feature.name}" failed:`, error);
      }
    }
  }
}

function main() {
  // On nuke.family's token-generation page the only job is capturing the
  // token. None of the Torn-side bootstrap belongs there: the first-run prompt
  // would fire on the very page it points to, and the update nag and cache
  // sync would run against nuke.family's own localStorage.
  //
  // TornPDA's own store is read first (never migrated from here: this is
  // nuke.family's localStorage), so a key captured here is saved where the
  // Torn side will find it.
  if (IsPage(PageType.NukeFamily3rdParty)) {
    if (hasNativeStorage()) initStorage({ migrate: false }).then(initTokenCapture);
    else initTokenCapture();
    return;
  }

  // In TornPDA the key and settings come from the app's own store, which can
  // only be read asynchronously: wait for it before anything reads them.
  // Everywhere else the script starts at once, as it always has.
  if (hasNativeStorage()) initStorage().then(start);
  else start();
}

function start() {
  addStyle(styles);
  LogInfo("Nuke Family Helper Script Loaded");

  checkForUpdates();

  // Load cached data from previous sessions. Registration must happen before
  // any feature runs, so a manual force-refresh covers every store.
  for (const store of [shitlistStore, categoriesStore, contractsStore, ocConfigStore]) {
    store.load();
    registerSyncedStore(store);
  }

  // The nuke.family key, and the bar that says so (with a Connect button)
  // when there is none or it is not working.
  initAuth();
  initConnect();

  // Run features for the current page, and re-dispatch on SPA navigation
  // (Torn's faction page switches tabs via the location hash).
  dispatchFeatures();
  onNavigate(dispatchFeatures);

  // Refresh any stale caches (server-timestamp based, with time-based fallback)
  checkCacheUpdates();
}

main();
