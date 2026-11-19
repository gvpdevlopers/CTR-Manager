const test = require("node:test");
const assert = require("node:assert/strict");
const checks = require("../models/RedditCTRCheck");
const redditService = require("../services/redditVerify.service");
const cronPath = require.resolve("../cron/redditCTR.cron");

test("Reddit batch checks pending claims and skips completed and recent failures", async t => {
  const now = new Date();
  const rows = [
    { _id: "pending", status: "pending" },
    { _id: "legacy", status: "not_done", verifiedAt: null },
    { _id: "done", status: "done", verifiedAt: now },
    { _id: "recent-failure", status: "unavailable", updatedAt: now },
    { _id: "retry", status: "unavailable", updatedAt: new Date(now - 16 * 60000) },
  ];
  t.mock.method(checks, "find", async () => rows);
  const called = [];
  t.mock.method(redditService, "verifyRedditCTR", async id => called.push(id));
  delete require.cache[cronPath];
  const { runRedditCTRVerification } = require(cronPath);
  assert.deepEqual(await runRedditCTRVerification(), { processed: 3 });
  assert.deepEqual(called, ["pending", "legacy", "retry"]);
  delete require.cache[cronPath];
});
