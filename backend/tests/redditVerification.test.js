const { test } = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const RedditCTRCheck = require("../models/RedditCTRCheck");
const { verifyRedditCTR } = require("../services/redditVerify.service");

function listing(times) {
  return { data: { data: { children: times.map((time) => ({ data: { created_utc: time / 1000 } })), after: null } } };
}

function setup(t, check, responses) {
  check.save = async () => {};
  t.mock.method(RedditCTRCheck, "find", async () => [check]);
  let index = 0;
  t.mock.method(axios, "get", async () => {
    const response = responses[index++];
    if (response instanceof Error) throw response;
    return response;
  });
}

test("Reddit verification counts comments in 24 hours and a post within 15 days", async (t) => {
  const now = Date.now();
  const check = { username1: "test_user" };
  setup(t, check, [listing([now - 1000, now - 2000, now - 25 * 3600000]), listing([now - 14 * 86400000])]);
  await verifyRedditCTR("check");
  assert.equal(check.status, "done");
  assert.equal(check.actual.comments24h, 2);
  assert.ok(check.actual.postValidTill.getTime() - now < 2 * 86400000);
});

test("failed or incomplete Reddit responses are unavailable, not zero", async (t) => {
  const check = { username1: "test_user", actual: { comments24h: 5 } };
  setup(t, check, [new Error("blocked")]);
  await verifyRedditCTR("check");
  assert.equal(check.status, "unavailable");
  assert.equal(check.actual, null);
  assert.ok(check.failureReasons.length);
});

test("old posts cannot satisfy the 15-day requirement", async (t) => {
  const now = Date.now();
  const check = { username1: "test_user" };
  setup(t, check, [listing([now - 1000, now - 2000]), listing([now - 16 * 86400000])]);
  await verifyRedditCTR("check");
  assert.equal(check.status, "suspicious");
  assert.equal(check.actual.postDone, false);
});

test("missing timestamps are unavailable", async (t) => {
  const check = { username1: "test_user" };
  setup(t, check, [{ data: { data: { children: [{ data: {} }], after: null } } }]);
  await verifyRedditCTR("check");
  assert.equal(check.status, "unavailable");
});
