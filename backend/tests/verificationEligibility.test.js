const test = require("node:test");
const assert = require("node:assert/strict");
const { shouldVerify, RETRY_DELAY_MS } = require("../services/verificationEligibility");

test("only pending claims and cooled-down failures are eligible", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  assert.equal(shouldVerify(null, now), true);
  assert.equal(shouldVerify({ status: "pending" }, now), true);
  assert.equal(shouldVerify({ status: "pending", verifiedAt: now }, now), false);
  for (const status of ["done", "not_done", "suspicious"]) assert.equal(shouldVerify({ status }, now), false);
  assert.equal(shouldVerify({ status: "not_done", metadata: { error: "Employee did not mark CTR done" } }, now), true);
  assert.equal(shouldVerify({ status: "unavailable", lastAttemptAt: now }, now), false);
  assert.equal(shouldVerify({ status: "unavailable", metadata: { attemptedAt: new Date(now - RETRY_DELAY_MS) } }, now), true);
});
