const test = require("node:test");
const assert = require("node:assert/strict");
process.env.APIFY_TOKEN ||= "test-token";
process.env.APIFY_QUORA_ACTOR_ID ||= "test-actor";
const accountModel = require("../models/QuoraAccount");
const checkModel = require("../models/QuoraCTRCheck");
const executionModel = require("../models/TaskExecution");
const apify = require("../services/quoraApify.service");
const servicePath = require.resolve("../services/quoraCTRVerify.service");

test("a complete suspicious observation advances baseline and retains a recent question observation", async t => {
  const account = { _id: "account", baselineFollowing: 10, baselineAnswers: 20, baselineQuestions: 5, save: async () => {} };
  t.mock.method(accountModel, "findById", async () => account);
  t.mock.method(executionModel, "findOne", async () => ({ employeeId: "employee" }));
  let lookups = 0;
  t.mock.method(checkModel, "findOne", () => {
    if (lookups++ === 0) return Promise.resolve(null);
    return { sort: async () => ({ activityMeta: { questionsValidTill: new Date(Date.now() + 86400000) } }) };
  });
  let written;
  t.mock.method(checkModel, "findOneAndUpdate", async (_filter, update) => { written = update.$set; return written; });
  t.mock.method(apify, "fetchQuoraProfileData", async () => ({ success: true, following: 11, answers: 20, questions: 5, runId: "run" }));
  delete require.cache[servicePath];
  const { verifyQuoraCTR } = require(servicePath);
  await verifyQuoraCTR("account", "2026-11-19");
  assert.equal(written.status, "suspicious");
  assert.ok(written.activityMeta.questionsValidTill);
  assert.equal(account.baselineFollowing, 11);
  assert.equal(account.baselineAnswers, 20);
  assert.equal(account.baselineQuestions, 5);
  delete require.cache[servicePath];
});

test("a saved observation repairs an interrupted baseline update without rerunning the actor", async t => {
  const capturedAt = new Date("2026-11-18T10:00:00Z");
  const verifiedAt = new Date("2026-11-19T10:00:00Z");
  const account = { _id: "account", profileUrl: "https://www.quora.com/profile/Test", baselineCapturedAt: capturedAt, baselineFollowing: 10, baselineAnswers: 20, baselineQuestions: 5 };
  t.mock.method(accountModel, "findById", async () => account);
  t.mock.method(checkModel, "findOne", async () => ({ status: "done", metadata: { verifiedAt }, actual: { followingBefore: 10, answersBefore: 20, questionsBefore: 5, followingAfter: 11, answersAfter: 22, questionsAfter: 6 } }));
  let update;
  t.mock.method(accountModel, "updateOne", async (filter, values) => { update = { filter, values }; });
  let actorCalls = 0;
  t.mock.method(apify, "fetchQuoraProfileData", async () => { actorCalls++; });
  delete require.cache[servicePath];
  await require(servicePath).verifyQuoraCTR("account", "2026-11-19");
  assert.equal(update.values.$set.baselineAnswers, 22);
  assert.equal(update.filter.baselineAnswers, 20);
  assert.equal(actorCalls, 0);
  delete require.cache[servicePath];
});
