const test = require("node:test");
const assert = require("node:assert/strict");
const cron = require("node-cron");

test("all platforms schedule verification at 11 PM Kolkata time", t => {
  const calls = [];
  t.mock.method(cron, "schedule", (expression, callback, options) => { calls.push({ expression, callback, options }); return {}; });
  for (const [path, method] of [["../cron/instagramCTR.cron", "startInstagramCTRCron"], ["../cron/quoraCTR.cron", "startQuoraCTRCron"], ["../cron/redditCTR.cron", "startRedditCTRCron"]]) {
    delete require.cache[require.resolve(path)];
    require(path)[method]();
  }
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.expression, "0 23 * * *");
    assert.equal(call.options.timezone, "Asia/Kolkata");
    assert.equal(typeof call.callback, "function");
  }
});

test("node-cron matches 23:00 IST and not adjacent times", () => {
  const task = cron.createTask("0 23 * * *", () => {}, { timezone: "Asia/Kolkata" });
  assert.equal(task.timeMatcher.match(new Date("2026-11-19T17:29:00Z")), false);
  assert.equal(task.timeMatcher.match(new Date("2026-11-19T17:30:00Z")), true);
  assert.equal(task.timeMatcher.match(new Date("2026-11-19T17:31:00Z")), false);
});
