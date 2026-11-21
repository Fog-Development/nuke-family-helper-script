import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDateTime, parseApiUtcDate } from "../../src/core/time.js";

describe("time helpers", () => {
  it("reads API datetimes as UTC and formats them in TCT whatever the browser timezone", () => {
    const date = parseApiUtcDate("2025-12-30 02:31:00");
    assert.equal(date.toISOString(), "2025-12-30T02:31:00.000Z");
    assert.equal(formatDateTime(date), "2025-12-30 02:31");
  });

  it("returns null for a missing API datetime", () => {
    assert.equal(parseApiUtcDate(null), null);
  });
});
