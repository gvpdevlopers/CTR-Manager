const { randomUUID } = require("crypto");
const VerificationRun = require("../models/VerificationRun");
const { AsyncLocalStorage } = require("async_hooks");
const runContext = new AsyncLocalStorage();
const { ApifyClient } = require("apify-client");
const { businessDate } = require("../utils/businessDate");
const LEASE_MS = 15 * 60 * 1000;
const HEARTBEAT_MS = 60 * 1000;

async function getRun(platform) {
  const run = await VerificationRun.findById(platform).lean();
  if (!run) return { status: "idle" };
  if (run.actorStatus === "STARTING" && !run.actorRunId && (run.status !== "running" || run.leaseUntil <= new Date())) {
    return { ...run, status: "failed", error: "The previous actor start has an unknown outcome. Review Apify runs before retrying." };
  }
  if (run.status === "running" && run.leaseUntil <= new Date()) {
    return { ...run, status: "failed", error: "The previous run stopped or its lease expired." };
  }
  return run;
}

async function startRun(platform, work, { operation = "verification", date = null } = {}) {
  const now = new Date();
  const runId = randomUUID();
  const previous = await VerificationRun.findById(platform).lean();
  // A request may have reached Apify even if the backend died before receiving
  // its run ID. Fail closed instead of creating a possible duplicate actor.
  if (previous?.actorStatus === "STARTING" && !previous.actorRunId && (previous.status !== "running" || previous.leaseUntil <= now)) {
    throw new Error("Previous actor start has an unknown outcome; review Apify runs before restarting verification");
  }
  if (previous?.actorRunId && (previous.status !== "running" || previous.leaseUntil <= now) && !["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(previous.actorStatus)) {
    if (!process.env.APIFY_TOKEN) throw new Error("Cannot check the previous Apify run without its token");
    let actor;
    try { actor = await new ApifyClient({ token: process.env.APIFY_TOKEN }).run(previous.actorRunId).get(); }
    catch { throw new Error("Cannot check the previous Apify run; verification was not restarted"); }
    if (!actor || !["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(actor.status)) return false;
    previous.actorFinishedAt = actor.finishedAt || previous.actorFinishedAt;
  }
  try {
    await VerificationRun.findOneAndUpdate(
      { _id: platform, $or: [{ status: { $ne: "running" } }, { leaseUntil: { $lte: now } }] },
      { $set: { status: "running", runId, startedAt: now, finishedAt: null, leaseUntil: new Date(now.getTime() + LEASE_MS), error: null, result: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
  const heartbeat = setInterval(() => {
    VerificationRun.updateOne({ _id: platform, runId, status: "running" }, { $set: { leaseUntil: new Date(Date.now() + LEASE_MS) } }).catch((error) => console.error("Verification lease renewal failed:", error.message));
  }, HEARTBEAT_MS);
  heartbeat.unref();
  Promise.resolve().then(() => runContext.run({ platform, runId, operation, date: date || businessDate(now), recovery: previous }, work)).then(async (result) => {
    await VerificationRun.updateOne({ _id: platform, runId }, { $set: { status: "completed", finishedAt: new Date(), result } });
  }).catch(async (error) => {
    console.error(`${platform} verification failed:`, error);
    await VerificationRun.updateOne({ _id: platform, runId }, { $set: { status: "failed", finishedAt: new Date(), error: "Verification failed. Check server logs." } });
  }).catch((error) => console.error("Failed to persist verification outcome:", error)).finally(() => clearInterval(heartbeat));
  return true;
}

// Synchronous callers (such as baseline capture) use the same platform lease.
async function runWithLock(platform, work, options) {
  let resolveWork;
  let rejectWork;
  const finished = new Promise((resolve, reject) => { resolveWork = resolve; rejectWork = reject; });
  const started = await startRun(platform, async () => {
    try { const result = await work(); resolveWork(result); return result; }
    catch (error) { rejectWork(error); throw error; }
  }, options);
  if (!started) return { started: false };
  return { started: true, result: await finished };
}
async function recordActorRun(actorRunId, actorStatus, actorUsageUsd = null, actorTarget = null, finishedAt = null) {
  const context = runContext.getStore();
  if (!context) return;
  const result = await VerificationRun.updateOne(
    { _id: context.platform, runId: context.runId, status: "running" },
    { $set: { actorRunId, actorStatus, actorUsageUsd, ...(actorTarget ? { actorTarget, actorDate: context.date, actorOperation: context.operation } : {}), ...(actorStatus === "STARTING" ? { actorStartedAt: new Date(), actorFinishedAt: null } : {}), ...(finishedAt ? { actorFinishedAt: finishedAt } : {}) } }
  );
  if (!result.matchedCount) throw new Error("Verification lease was lost while tracking the actor run");
}
async function recordActorStartIntent(actorTarget) {
  return recordActorRun(null, "STARTING", null, actorTarget);
}
function getRecoveryActor(target) {
  const context = runContext.getStore();
  const previous = context?.recovery;
  if (!previous?.actorRunId || !["running", "failed"].includes(previous.status) || previous.actorTarget !== target || previous.actorDate !== context.date || previous.actorOperation !== context.operation) return null;
  return previous.actorRunId;
}
function getRecoveryTarget() {
  const context = runContext.getStore();
  const target = context?.recovery?.actorTarget;
  return target && getRecoveryActor(target) ? target : null;
}
function getRecoveryObservedAt(target) {
  if (!getRecoveryActor(target)) return null;
  const previous = runContext.getStore().recovery;
  const time = previous.actorFinishedAt || previous.actorStartedAt || previous.startedAt;
  const date = time && new Date(time);
  return date && Number.isFinite(date.getTime()) ? date : null;
}
module.exports = { getRun, startRun, runWithLock, recordActorRun, recordActorStartIntent, getRecoveryActor, getRecoveryTarget, getRecoveryObservedAt };
