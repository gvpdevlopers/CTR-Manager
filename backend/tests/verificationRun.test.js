const test = require("node:test");
const assert = require("node:assert/strict");
const VerificationRun = require("../models/VerificationRun");
const { startRun, getRun, runWithLock } = require("../services/verificationRun.service");
const { ApifyClient } = require("apify-client");
const { businessDate, claimDateRange } = require("../utils/businessDate");

test("business date changes at midnight in Kolkata", () => {
  assert.equal(businessDate(new Date("2026-01-01T18:29:59Z")), "2026-01-01");
  assert.equal(businessDate(new Date("2026-01-01T18:30:00Z")), "2026-01-02");
  assert.equal(claimDateRange("2026-01-02").start.toISOString(), "2026-01-02T00:00:00.000Z");
});
test("an existing active lease blocks a competing run", async (t) => {
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => null }));
  t.mock.method(VerificationRun, "findOneAndUpdate", async () => { const error = new Error("duplicate"); error.code = 11000; throw error; });
  assert.equal(await startRun("quora", () => {}), false);
});
test("expired leases are reported as failed", async (t) => {
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => ({ status: "running", leaseUntil: new Date(0) }) }));
  assert.equal((await getRun("quora")).status, "failed");
});

test("baseline capture cannot start while a platform run holds its lease", async t => {
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => null }));
  t.mock.method(VerificationRun, "findOneAndUpdate", async () => { const error = new Error("duplicate"); error.code = 11000; throw error; });
  let called = false;
  assert.deepEqual(await runWithLock("quora", async () => { called = true; }), { started: false });
  assert.equal(called, false);
});

test("an expired lease does not restart while the recorded actor is still running", async t => {
  const oldToken = process.env.APIFY_TOKEN;
  process.env.APIFY_TOKEN = "test";
  t.after(() => { if (oldToken === undefined) delete process.env.APIFY_TOKEN; else process.env.APIFY_TOKEN = oldToken; });
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => ({ status: "running", leaseUntil: new Date(0), actorRunId: "run", actorStatus: "RUNNING" }) }));
  t.mock.method(ApifyClient.prototype, "run", () => ({ get: async () => ({ status: "RUNNING" }) }));
  assert.equal(await startRun("quora", () => {}), false);
});

test("an uncertain actor start is not repeated automatically", async t => {
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => ({ status: "running", leaseUntil: new Date(0), actorStatus: "STARTING", actorRunId: null }) }));
  await assert.rejects(startRun("instagram", () => {}), /unknown outcome/);
  assert.match((await getRun("instagram")).error, /unknown outcome/);
});
