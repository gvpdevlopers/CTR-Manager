const test = require("node:test");
const assert = require("node:assert/strict");
const RedditAccount = require("../models/RedditAccount");
const QuoraAccount = require("../models/QuoraAccount");
const reddit = require("../controllers/redditAccountController");
const quora = require("../controllers/quoraAccountController");

function response() { return { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } }; }

test("employee Reddit updates only edit account fields", async t => {
  let update;
  t.mock.method(RedditAccount, "findByIdAndUpdate", async (_id, data, options) => { update = data; assert.equal(options.runValidators, true); return { userId: "101" }; });
  const res = response();
  await reddit.updateRedditAccount({ params: { id: "id" }, user: { role: "employee" }, body: { name1: "alice", ownerEmployeeId: "other", ctrDone: true } }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(update, { name1: "alice" });
});

test("employee Quora updates cannot alter baseline fields directly", async t => {
  let update;
  t.mock.method(QuoraAccount, "findByIdAndUpdate", async (_id, data) => { update = data; return { userId: "101" }; });
  const res = response();
  await quora.updateQuoraAccount({ params: { id: "id" }, user: { role: "employee" }, body: { name1: "alice", baselineAnswers: 999, verificationEnabled: false } }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(update, { name1: "alice" });
});

test("employee profile changes still require baseline reset confirmation", async t => {
  t.mock.method(QuoraAccount, "findById", async () => ({ profileUrl: "https://www.quora.com/profile/Original", baselineCapturedAt: new Date() }));
  const res = response();
  await quora.updateQuoraAccount({ params: { id: "id" }, user: { role: "employee" }, body: { profileUrl: "https://www.quora.com/profile/Other" } }, res);
  assert.equal(res.code, 409);
});
