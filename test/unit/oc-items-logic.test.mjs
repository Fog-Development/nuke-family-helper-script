import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { availableCopy, currentLoans, readLoanAnswer, stillMissing, tabInHash, unusedLoans } from "../../src/features/oc-items/logic.js";

describe("OC items logic", () => {
  const siteLoans = [
    { item_id: 70, item_name: "Polymorphic Virus", tab: "utilities", player_id: 1, player_name: "Ann" },
    { item_id: 222, item_name: "Flash Grenade", tab: "temporary", player_id: 2, player_name: "Ben" },
  ];

  it("lets the tabs open on the page replace the site's loans", () => {
    const live = { utilities: [{ itemId: 1509, name: "Angle Grinder", loanedTo: 3, loanedName: "Cy" }, { itemId: 1379, name: "ATM Key", loanedTo: null }] };
    const loans = currentLoans(siteLoans, live);
    assert.deepEqual(loans.map((loan) => [loan.item_id, loan.player_id]), [[222, 2], [1509, 3]]);
  });

  it("finds OC loans their holder's crime doesn't need", () => {
    const loans = [...siteLoans, { item_id: 26, item_name: "AK-47", tab: "weapons", player_id: 1, player_name: "Ann" }];
    const unused = unusedLoans(loans, { 1: [70], 4: [222] }, [70, 222]);
    assert.deepEqual(unused.map((loan) => [loan.player_name, loan.item_id, loan.reason]), [["Ben", 222, "not in a crime"]], "the AK-47 is no OC item");
    assert.equal(unusedLoans(loans, { 2: [1379] }, [222])[0].reason, "their crime doesn't need it");
  });

  it("counts a loan made from the page as done", () => {
    const missing = [{ player_id: 1, item_id: 70 }, { player_id: 2, item_id: 70 }];
    assert.deepEqual(stillMissing(missing, new Set(["1:70"])), [{ player_id: 2, item_id: 70 }]);
  });

  it("lends a free copy, plain before one with bonuses", () => {
    const rows = [
      { itemId: 26, loanedTo: 5, canLoan: false },
      { itemId: 26, loanedTo: null, canLoan: true, hasBonus: true, armoryId: "a" },
      { itemId: 26, loanedTo: null, canLoan: true, hasBonus: false, armoryId: "b" },
    ];
    assert.equal(availableCopy(rows, 26).armoryId, "b");
    assert.equal(availableCopy(rows, 27), null);
  });

  it("reads the armoury tab from the hash", () => {
    assert.equal(tabInHash("#/tab=armoury&start=0&sub=utilities"), "utilities");
    assert.equal(tabInHash("#/tab=crimes"), null);
  });

  it("reads Torn's answer to a loan", () => {
    assert.deepEqual(readLoanAnswer('{"success":true,"message":"You loaned <b>ATM Key</b> to Ann."}'), { ok: true, message: "You loaned ATM Key to Ann." });
    assert.equal(readLoanAnswer('{"success":false,"message":"Not allowed"}').ok, false);
    assert.equal(readLoanAnswer("").ok, false);
  });
});
