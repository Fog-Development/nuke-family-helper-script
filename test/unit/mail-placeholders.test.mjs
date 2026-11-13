import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fill, parseRecipient, placeholdersIn, tornDate } from "../../src/features/mail-templates/placeholders.js";

describe("mail template placeholders", () => {
  it("fills known placeholders and names the ones with no value yet", () => {
    const out = fill("Hi {name} [{id}], from {me}. {Name}!", { name: "Alice", id: null, me: "Bob" });
    assert.equal(out.text, "Hi Alice [{id}], from Bob. Alice!");
    assert.deepEqual(out.missing, ["id"]);
  });

  it("leaves unknown {words} alone", () => {
    assert.deepEqual(fill("{faction} and {name}", { name: "A" }), { text: "{faction} and A", missing: [] });
  });

  it("escapes values put into HTML", () => {
    assert.equal(fill("<p>{name}</p>", { name: "<b>x</b> & y" }, { html: true }).text, "<p>&lt;b&gt;x&lt;/b&gt; &amp; y</p>");
    assert.equal(fill("{name}", { name: "<b>" }).text, "<b>", "a subject is plain text");
  });

  it("reads Torn's recipient box", () => {
    assert.deepEqual(parseRecipient("Fogest [2254826]"), { name: "Fogest", id: "2254826" });
    assert.deepEqual(parseRecipient("2254826"), { name: null, id: "2254826" });
    assert.deepEqual(parseRecipient("fog"), { name: "fog", id: null });
    assert.deepEqual(parseRecipient(""), { name: null, id: null });
  });

  it("dates and times in Torn time (UTC)", () => {
    assert.deepEqual(tornDate(new Date("2026-11-03T04:05:00Z")), { date: "03/11/26", time: "04:05" });
  });

  it("lists the placeholders a text uses", () => {
    assert.deepEqual(placeholdersIn("{name} {x} {DATE} {name}"), ["name", "date"]);
  });
});
