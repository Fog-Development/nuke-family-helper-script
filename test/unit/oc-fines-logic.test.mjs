import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bannerText, clampPanel, crimeChoices, panelPosition, defaultCrimeFor, fineChipLabel, quoteLine, recipientFor, REASON_FOR_FLAG } from "../../src/features/oc-fines/logic.js";

const context = {
  reasons: [
    { key: "delay_travel", crime: "expected", default_crime_id: 501, quote: { summary: "Strike 2 on the shared ladder: 10 points" } },
    { key: "idle_after_oc", crime: "never", default_crime_id: null },
    { key: "cpr_too_low", crime: "expected", default_crime_id: 999 },
  ],
  crimes: [{ crime_id: 501, label: "Current · Stage Fright L5 · Lookout" }],
};

describe("OC fine logic", () => {
  it("names the crime the site suggests, none for idle, and one the site doesn't list only when read off the page", () => {
    assert.equal(defaultCrimeFor(context, "delay_travel"), "501");
    assert.equal(defaultCrimeFor(context, "idle_after_oc", 777), null);
    assert.equal(defaultCrimeFor(context, "cpr_too_low"), null, "a suggestion the site no longer lists is dropped");
    assert.equal(defaultCrimeFor(context, "cpr_too_low", 777), "777");
  });

  it("adds the page's crime to the choices when the site has not seen it", () => {
    assert.deepEqual(
      crimeChoices(context, { id: 777, label: "Sneaky Git Grab L3 · Pickpocket" }).map((c) => c.id),
      ["777", "501"],
    );
    assert.equal(crimeChoices(context, { id: 501, label: "x" }).length, 1);
  });

  it("maps staff flags to reasons", () => {
    assert.deepEqual(REASON_FOR_FLAG, { unqualified: "cpr_too_low", unproductive: "unproductive", underlevel: "cpr_too_high" });
  });

  it("words the banner, chips and recipient", () => {
    assert.equal(bannerText({ unpaid: [] }), null);
    assert.equal(
      bannerText({ unpaid: [{ currency: "points", amount: 10 }, { currency: "points", amount: 15 }, { currency: "cash", amount: 250000 }] }),
      "You owe 25 points and $250,000 in OC fines (3 unpaid).",
    );
    assert.equal(fineChipLabel({ player_name: "Bob", player_id: 42, penalty: "Warning", reason: "Idle after previous OC" }), "Bob · Warning · Idle after previous OC");
    assert.equal(recipientFor({ player_name: "Bob", player_id: 42 }), "Bob [42]");
    assert.equal(quoteLine(context, "delay_travel"), "Strike 2 on the shared ladder: 10 points");
  });

  it("keeps a saved panel spot only while its header and some form fit the window", () => {
    const view = { width: 1000, height: 700 };
    const size = { panelWidth: 360, headHeight: 30 };
    assert.deepEqual(panelPosition({ left: 100.4, top: 50 }, view, size), { left: 100, top: 50 });
    assert.equal(panelPosition(null, view, size), null);
    assert.equal(panelPosition({ left: "x", top: 1 }, view, size), null);
    assert.equal(panelPosition({ left: -1, top: 0 }, view, size), null);
    assert.equal(panelPosition({ left: 700, top: 0 }, view, size), null, "runs off the right");
    assert.equal(panelPosition({ left: 0, top: 600 }, view, size), null, "no room for the form");
    assert.deepEqual(clampPanel(-50, 9999, view, size), { left: 0, top: 550 });
    assert.deepEqual(clampPanel(9999, -5, view, size), { left: 640, top: 0 });
  });
});
