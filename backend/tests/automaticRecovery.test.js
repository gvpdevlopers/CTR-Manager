const test = require("node:test");
const assert = require("node:assert/strict");
const VerificationRun = require("../models/VerificationRun");
const lock = require("../services/verificationRun.service");

test("recovery restarts an expired verification through the shared lock", async t => {
  let filter;
  t.mock.method(VerificationRun, "find", query => { filter = query; return { lean: async () => [{ _id: "instagram" }] }; });
  const started = [];
  t.mock.method(lock, "startRun", async (platform, work) => { started.push({ platform, work }); return true; });
  const path = require.resolve("../services/verificationRecovery.service");
  delete require.cache[path];
  await require(path).recoverInterruptedVerifications();
  assert.equal(started[0].platform, "instagram");
  assert.equal(typeof started[0].work, "function");
  assert.equal(filter.status, "running");
  assert.equal(filter.actorOperation, "verification");
  delete require.cache[path];
});
