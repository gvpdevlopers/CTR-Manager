const test = require("node:test");
const assert = require("node:assert/strict");
const RedditAccount = require("../models/RedditAccount");
const RedditCTRCheck = require("../models/RedditCTRCheck");
const controller = require("../controllers/redditCTR.controller");

function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }

test("Reddit daily claims are shared and preserve the first employee", async t => {
  const accountId = "6959eaa6f138ba96c720f0e9";
  t.mock.method(RedditAccount, "findById", async () => ({ _id: accountId, name1: "one", name2: "two" }));
  let saved;
  t.mock.method(RedditCTRCheck, "findOne", () => ({ sort: async () => saved || null }));
  t.mock.method(RedditCTRCheck, "findOneAndUpdate", async (query, update) => {
    saved ||= { _id: query._id, ...update.$setOnInsert };
    return saved;
  });
  const first = response();
  await controller.markCTRDone({ body: { redditAccountId: accountId }, user: { _id: "first" } }, first);
  const second = response();
  await controller.markCTRDone({ body: { redditAccountId: accountId }, user: { _id: "second" } }, second);
  assert.equal(first.body.markedBy, "first");
  assert.equal(second.body.markedBy, "first");
  assert.equal(saved.status, "pending");
});

test("Reddit claim rejects invalid account identifiers", async () => {
  const res = response();
  await controller.markCTRDone({ body: { redditAccountId: "invalid" }, user: { _id: "user" } }, res);
  assert.equal(res.code, 400);
});
