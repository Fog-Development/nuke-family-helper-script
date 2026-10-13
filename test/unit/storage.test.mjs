import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

// storage.js keeps its state at module level, so every test loads its own copy
// against its own fake browser: a localStorage, a userscript manager, and
// (when `app` is given) TornPDA's PDA_storage.
let copy = 0;
async function load({ local = {}, manager = {}, app = undefined, failWrites = false, loadFails = false } = {}) {
  const localData = { ...local };
  const managerData = { ...manager };
  globalThis.localStorage = {
    getItem: (key) => (key in localData ? localData[key] : null),
    setItem: (key, value) => {
      localData[key] = String(value);
    },
    removeItem: (key) => {
      delete localData[key];
    },
  };
  globalThis.GM_getValue = (key, fallback) => (key in managerData ? managerData[key] : fallback);
  globalThis.GM_setValue = (key, value) => {
    managerData[key] = value;
  };

  let appData;
  if (app === undefined) {
    delete globalThis.PDA_storage;
  } else {
    appData = { ...app };
    globalThis.PDA_storage = {
      loadAll: async () => {
        if (loadFails) throw new Error("bridge down");
        return { ...appData };
      },
      setMany: async (pairs) => {
        if (failWrites) throw Object.assign(new Error("full"), { code: "QuotaExceeded" });
        Object.assign(appData, pairs);
      },
      usage: async () => ({ used: 10, quota: 100 }),
    };
  }

  copy += 1;
  const storage = await import(`../../src/core/storage.js?copy=${copy}`);
  return { storage, localData, managerData, appData };
}

afterEach(() => {
  delete globalThis.PDA_storage;
  delete globalThis.localStorage;
  delete globalThis.GM_getValue;
  delete globalThis.GM_setValue;
});

describe("storage without TornPDA's store", () => {
  it("reads and writes where the script always has", async () => {
    const { storage, localData, managerData } = await load({
      local: { nfhRankedWar: '{"sort":"stats"}' },
      manager: { apiToken: "key-one" },
    });
    assert.equal(storage.hasNativeStorage(), false);
    await storage.initStorage();

    assert.equal(storage.getValue("apiToken", ""), "key-one");
    assert.equal(storage.getValue("apiTokenFirstTime", false), false);
    assert.equal(storage.getItem("nfhRankedWar"), '{"sort":"stats"}');
    assert.equal(storage.getItem("nfhChainWatch"), null);

    storage.setValue("apiToken", "key-two");
    storage.setItem("nfhShowReputation", false);
    assert.equal(managerData.apiToken, "key-two");
    assert.equal(localData.nfhShowReputation, "false");
    assert.equal((await storage.storageInfo()).backend, "default");
  });
});

describe("storage with TornPDA's store", () => {
  it("moves the key and settings across the first time, leaving the old copies", async () => {
    const { storage, localData, managerData, appData } = await load({
      local: { nfhChainWatch: '{"beep":true}', nfhOcConfig: "a big cache" },
      manager: { apiToken: "key-one", apiTokenFirstTime: true },
      app: {},
    });
    await storage.initStorage();

    assert.deepEqual(appData, { apiToken: "key-one", apiTokenFirstTime: true, nfhChainWatch: '{"beep":true}' });
    assert.equal(storage.getValue("apiToken", ""), "key-one");
    assert.equal(storage.getItem("nfhChainWatch"), '{"beep":true}');
    // Still where an older version of the script would look.
    assert.equal(managerData.apiToken, "key-one");
    assert.equal(localData.nfhChainWatch, '{"beep":true}');

    const info = await storage.storageInfo();
    assert.equal(info.backend, "pda_storage");
    assert.deepEqual(info.migrated.sort(), ["apiToken", "apiTokenFirstTime", "nfhChainWatch"]);
    assert.deepEqual(info.unsaved, []);
    assert.deepEqual(info.usage, { used: 10, quota: 100 });
    // Names only, never the key itself.
    assert.ok(!JSON.stringify(info).includes("key-one"));
  });

  it("gives back the key after the page's storage was cleared", async () => {
    const { storage, managerData, localData } = await load({
      app: { apiToken: "key-one", nfhRankedWar: '{"sort":"stats"}' },
    });
    await storage.initStorage();

    assert.equal(storage.getValue("apiToken", ""), "key-one");
    assert.equal(storage.getItem("nfhRankedWar"), '{"sort":"stats"}');
    assert.equal(managerData.apiToken, "key-one");
    assert.equal(localData.nfhRankedWar, '{"sort":"stats"}');
    assert.deepEqual((await storage.storageInfo()).restored.sort(), ["apiToken", "nfhRankedWar"]);
  });

  it("believes the app's store where the two disagree", async () => {
    const { storage, managerData } = await load({ manager: { apiToken: "stale" }, app: { apiToken: "current" } });
    await storage.initStorage();
    assert.equal(storage.getValue("apiToken", ""), "current");
    assert.equal(managerData.apiToken, "current");
  });

  it("writes to both places", async () => {
    const { storage, managerData, localData, appData } = await load({ app: { apiToken: "key-one" } });
    await storage.initStorage();

    storage.setValue("apiToken", "key-two");
    storage.setItem("nfhOcStaffPrefs", '{"levelGap":3}');
    assert.equal(storage.getValue("apiToken", ""), "key-two");
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(appData.apiToken, "key-two");
    assert.equal(appData.nfhOcStaffPrefs, '{"levelGap":3}');
    assert.equal(managerData.apiToken, "key-two");
    assert.equal(localData.nfhOcStaffPrefs, '{"levelGap":3}');
    assert.equal(localData.nfhNativeStorageUnsaved, undefined);
  });

  it("keeps a value the app refused, and does not let the app's old one win next time", async () => {
    const first = await load({ app: { apiToken: "old" }, failWrites: true });
    await first.storage.initStorage();
    first.storage.setValue("apiToken", "new");
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(first.storage.getValue("apiToken", ""), "new");
    assert.equal(first.appData.apiToken, "old");
    assert.deepEqual(JSON.parse(first.localData.nfhNativeStorageUnsaved), ["apiToken"]);
    assert.equal((await first.storage.storageInfo()).write_error, "QuotaExceeded");

    // The next page load, with the app's store working again.
    const next = await load({ local: first.localData, manager: first.managerData, app: first.appData });
    await next.storage.initStorage();
    assert.equal(next.storage.getValue("apiToken", ""), "new");
    assert.equal(next.appData.apiToken, "new");
    assert.equal(next.localData.nfhNativeStorageUnsaved, undefined);
  });

  it("carries on with the old place when the app's store cannot be read", async () => {
    const { storage, managerData } = await load({ manager: { apiToken: "key-one" }, app: {}, loadFails: true });
    await storage.initStorage();

    assert.equal(storage.getValue("apiToken", ""), "key-one");
    storage.setValue("apiToken", "key-two");
    assert.equal(managerData.apiToken, "key-two");
    const info = await storage.storageInfo();
    assert.equal(info.backend, "default");
    assert.equal(info.error, "bridge down");
  });

  it("only reads on nuke.family's token page, then saves the captured key to the app", async () => {
    const { storage, appData, managerData } = await load({
      manager: { apiToken: "left-over-on-nuke-family" },
      app: { nfhTokenReturnUrl: "https://www.torn.com/factions.php?step=your" },
    });
    await storage.initStorage({ migrate: false });

    assert.equal(appData.apiToken, undefined);
    assert.equal(storage.getValue("apiToken", ""), "");
    assert.equal(storage.getValue("nfhTokenReturnUrl", ""), "https://www.torn.com/factions.php?step=your");
    assert.equal(managerData.nfhTokenReturnUrl, undefined);

    storage.setValue("apiToken", "captured");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(appData.apiToken, "captured");
  });
});
