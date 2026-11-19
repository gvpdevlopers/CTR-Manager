const test = require("node:test");
const assert = require("node:assert/strict");
const TaskExecution = require("../models/TaskExecution");
const InstagramCTRCheck = require("../models/InstagramCTRCheck");
const apify = require("../services/instagramApify.service");
const cronPath = require.resolve("../cron/instagramCTR.cron");

test("Instagram scheduled batch does not start an actor for an already verified claim", async t => {
  const execution = { accountId: { _id: "account", username: "test" }, employeeId: "employee" };
  t.mock.method(TaskExecution, "find", () => ({ populate: async () => [execution] }));
  t.mock.method(InstagramCTRCheck, "findOne", async () => ({ status: "done", verifiedAt: new Date() }));
  let actorCalls = 0;
  t.mock.method(apify, "fetchInstagramProfile", async () => { actorCalls++; });
  delete require.cache[cronPath];
  const { runInstagramCTRVerification } = require(cronPath);
  assert.deepEqual(await runInstagramCTRVerification(), { processed: 0 });
  assert.equal(actorCalls, 0);
  delete require.cache[cronPath];
});
