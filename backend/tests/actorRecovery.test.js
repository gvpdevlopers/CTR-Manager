const test = require("node:test");
const assert = require("node:assert/strict");
const { ApifyClient } = require("apify-client");
const VerificationRun = require("../models/VerificationRun");
const { startRun } = require("../services/verificationRun.service");
const { businessDate } = require("../utils/businessDate");
const { fetchInstagramProfile } = require("../services/instagramApify.service");
const axios = require("axios");

test("a completed actor dataset is reused for the interrupted Instagram account", async t => {
  const previous = { status: "running", leaseUntil: new Date(0), actorRunId: "old-actor", actorStatus: "SUCCEEDED", actorTarget: "profile", actorDate: businessDate(), actorOperation: "verification" };
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => previous }));
  t.mock.method(VerificationRun, "findOneAndUpdate", async () => ({}));
  t.mock.method(VerificationRun, "updateOne", async () => ({ matchedCount: 1 }));
  let actorStarts = 0;
  t.mock.method(ApifyClient.prototype, "actor", () => ({ start: async () => { actorStarts++; throw new Error("unexpected new actor"); } }));
  t.mock.method(ApifyClient.prototype, "run", id => ({ get: async () => ({ id, status: "SUCCEEDED" }), waitForFinish: async () => ({ id, status: "SUCCEEDED", defaultDatasetId: "dataset" }) }));
  t.mock.method(ApifyClient.prototype, "dataset", () => ({ listItems: async () => ({ items: [{ followsCount: 7 }] }) }));
  let finish;
  const completed = new Promise((resolve, reject) => { finish = { resolve, reject }; });
  assert.equal(await startRun("instagram", async () => { try { finish.resolve(await fetchInstagramProfile("Profile")); } catch (error) { finish.reject(error); } }), true);
  assert.equal((await completed).followsCount, 7);
  assert.equal(actorStarts, 0);
});

test("an interrupted actor remains recoverable on a later business day", async t => {
  const previous = { status: "running", leaseUntil: new Date(0), actorRunId: "old-actor", actorStatus: "SUCCEEDED", actorTarget: "profile", actorDate: "2026-01-01", actorOperation: "verification", actorFinishedAt: new Date("2026-01-01T17:30:00Z") };
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => previous }));
  t.mock.method(VerificationRun, "findOneAndUpdate", async () => ({}));
  t.mock.method(VerificationRun, "updateOne", async () => ({ matchedCount: 1 }));
  let starts = 0;
  t.mock.method(ApifyClient.prototype, "actor", () => ({ start: async () => { starts++; throw new Error("unexpected new actor"); } }));
  t.mock.method(ApifyClient.prototype, "run", id => ({ get: async () => ({ id, status: "SUCCEEDED" }), waitForFinish: async () => ({ id, status: "SUCCEEDED", defaultDatasetId: "dataset" }) }));
  t.mock.method(ApifyClient.prototype, "dataset", () => ({ listItems: async () => ({ items: [{ followsCount: 7 }] }) }));
  let finish;
  const completed = new Promise((resolve, reject) => { finish = { resolve, reject }; });
  assert.equal(await startRun("instagram", async () => { try { finish.resolve(await fetchInstagramProfile("profile")); } catch (error) { finish.reject(error); } }, { date: "2026-01-01" }), true);
  assert.equal((await completed).followsCount, 7);
  assert.equal(starts, 0);
});

test("a completed Quora actor is reused rather than started again", async t => {
  process.env.APIFY_TOKEN ||= "test-token";
  process.env.APIFY_QUORA_ACTOR_ID ||= "test-actor";
  const target = "https://www.quora.com/profile/Test";
  const previous = { status: "running", leaseUntil: new Date(0), actorRunId: "old-quora", actorStatus: "SUCCEEDED", actorTarget: target, actorDate: businessDate(), actorOperation: "verification" };
  t.mock.method(VerificationRun, "findById", () => ({ lean: async () => previous }));
  t.mock.method(VerificationRun, "findOneAndUpdate", async () => ({}));
  t.mock.method(VerificationRun, "updateOne", async () => ({ matchedCount: 1 }));
  let starts = 0;
  t.mock.method(axios, "post", async () => { starts++; throw new Error("unexpected actor start"); });
  t.mock.method(axios, "get", async url => url.includes("actor-runs") ? { data: { data: { status: "SUCCEEDED", defaultDatasetId: "dataset" } } } : { data: [{ following: 3, answers: 2, questions: 1 }] });
  const { fetchQuoraProfileData } = require("../services/quoraApify.service");
  let finish;
  const completed = new Promise((resolve, reject) => { finish = { resolve, reject }; });
  assert.equal(await startRun("quora", async () => { try { finish.resolve(await fetchQuoraProfileData(target)); } catch (error) { finish.reject(error); } }), true);
  assert.equal((await completed).success, true);
  assert.equal(starts, 0);
});
