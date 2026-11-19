const { claimDateRange } = require("../utils/businessDate");
const QuoraAccount = require("../models/QuoraAccount");
const QuoraCTRCheck = require("../models/QuoraCTRCheck");
const TaskExecution = require("../models/TaskExecution");
const { fetchQuoraProfileData } = require("./quoraApify.service");
const { shouldVerify } = require("./verificationEligibility");
const { getRecoveryObservedAt } = require("./verificationRun.service");

async function verifyQuoraCTR(quoraAccountId, date) {
  console.log("──────────────────────────────────────");
  console.log("⏳ Starting Quora CTR verification");
  console.log("🚀 verifyQuoraCTR CALLED", quoraAccountId, date);

  const account = await QuoraAccount.findById(quoraAccountId);
  console.log("DEBUG: account =", !!account);

  if (!account) throw new Error("QuoraAccount not found");

  console.log("DEBUG: verificationEnabled =", account.verificationEnabled);
  if (account.verificationEnabled === false) return null;

  const existing = await QuoraCTRCheck.findOne({
    quoraAccountId: account._id,
    date,
  });

  if (!shouldVerify(existing)) {
    // A crash can occur after saving the daily result but before advancing the
    // account baseline. Repair only when the old baseline still matches the
    // values used for that result; never overwrite a newer/profile reset.
    const actual = existing?.actual;
    const before = [actual?.followingBefore, actual?.answersBefore, actual?.questionsBefore];
    const after = [actual?.followingAfter, actual?.answersAfter, actual?.questionsAfter];
    if (existing?.metadata?.verifiedAt && account.baselineCapturedAt &&
        before.every(Number.isFinite) && after.every(Number.isFinite) &&
        account.baselineFollowing === before[0] && account.baselineAnswers === before[1] && account.baselineQuestions === before[2]) {
      await QuoraAccount.updateOne(
        { _id: account._id, profileUrl: account.profileUrl, baselineFollowing: before[0], baselineAnswers: before[1], baselineQuestions: before[2], baselineCapturedAt: account.baselineCapturedAt },
        { $set: { baselineFollowing: after[0], baselineAnswers: after[1], baselineQuestions: after[2], baselineCapturedAt: existing.metadata.verifiedAt, lastCheckedAt: existing.metadata.verifiedAt } }
      );
    }
    console.log("Quora observation already completed or retry is cooling down");
    return existing;
  }

  console.log("🔎 Account:", account.userId);

  const { start, end } = claimDateRange(date);

  const taskExecution = await TaskExecution.findOne({
    accountId: account._id,
    platform: "quora",
    taskDate: { $gte: start, $lt: end },
  });

  console.log("DEBUG: taskExecution =", !!taskExecution);

  // 1️⃣ Employee did not mark CTR
  if (!taskExecution) {
    console.log("DEBUG EXIT → no taskExecution");
    return null;
  }

  const recoveredAt = getRecoveryObservedAt(account.profileUrl);
  if (recoveredAt && account.baselineCapturedAt && new Date(account.baselineCapturedAt) > recoveredAt) {
    return await QuoraCTRCheck.findOneAndUpdate(
      { quoraAccountId: account._id, date },
      { $set: { quoraAccountId: account._id, employeeId: taskExecution.employeeId, date, status: "unavailable", metadata: { error: "A newer baseline exists; review the interrupted result manually", attemptedAt: new Date() } } },
      { upsert: true, new: true }
    );
  }

  console.log("DEBUG: baseline =", {
    following: account.baselineFollowing,
    answers: account.baselineAnswers,
    questions: account.baselineQuestions,
  });

  // 2️⃣ Baseline missing
  if (
    account.baselineFollowing == null ||
    account.baselineAnswers == null ||
    account.baselineQuestions == null
  ) {
    console.log("DEBUG EXIT → baseline missing");
    return await QuoraCTRCheck.findOneAndUpdate(
      { quoraAccountId: account._id, date },
      {
        $set: {
          quoraAccountId: account._id,
          employeeId: account.ownerEmployeeId,
          date,
          status: "pending",
          metadata: { error: "Baseline not captured" },
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log("DEBUG → calling Apify");
  const apifyResult = await fetchQuoraProfileData(account.profileUrl);
  console.log("DEBUG: apifyResult =", apifyResult);

  // 3️⃣ Apify failed
  if (!apifyResult.success) {
    console.log("DEBUG EXIT → apify failed");
    return await QuoraCTRCheck.findOneAndUpdate(
      { quoraAccountId: account._id, date },
      {
        $set: {
          quoraAccountId: account._id,
          employeeId: taskExecution.employeeId,
          date,
          status: "unavailable",
          metadata: { error: apifyResult.error, attemptedAt: new Date() },
        },
      },
      { upsert: true, new: true }
    );
  }

  const { following, answers, questions, runId } = apifyResult;

  // 4️⃣ Defensive: reject silent zero results
  if (
    following === 0 &&
    answers === 0 &&
    questions === 0 &&
    (account.baselineFollowing > 0 ||
      account.baselineAnswers > 0 ||
      account.baselineQuestions > 0)
  ) {
    console.log("🚨 Apify returned all zeros — skipping write");
    return await QuoraCTRCheck.findOneAndUpdate(
      { quoraAccountId: account._id, date },
      {
        $set: {
          quoraAccountId: account._id,
          employeeId: taskExecution.employeeId,
          date,
          status: "unavailable",
          metadata: {
            apifyRunId: runId,
            error: "Apify returned zeroed metrics",
            attemptedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log("DEBUG → apify success");

  const answersDelta = Math.max(0, answers - account.baselineAnswers);
  const followingDelta = Math.max(0, following - account.baselineFollowing);
  const questionsDelta = Math.max(0, questions - account.baselineQuestions);

  // ============ 🔹 15-DAY RULE + 3-CONDITION LOGIC 🔹 ============

  const now = recoveredAt || new Date();

let followingValidTill = null;
let answersValidTill = null;
let questionsValidTill = null;
const previousQuestionObservation = await QuoraCTRCheck.findOne({
  quoraAccountId: account._id,
  date: { $lt: date },
  "activityMeta.questionsValidTill": { $gt: now },
}).sort({ date: -1 });
if (previousQuestionObservation) {
  questionsValidTill = previousQuestionObservation.activityMeta.questionsValidTill;
}

// Following → 24 hours
if (followingDelta > 0) {
  followingValidTill = new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

// Answers → 24 hours
if (answersDelta > 0) {
  answersValidTill = new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

// Questions → 15 days
if (questionsDelta > 0) {
  questionsValidTill = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
}

 const answersDone =
  answersValidTill && answersValidTill > now;

const followingDone =
  followingValidTill && followingValidTill > now;

const questionsDone =
  questionsValidTill && questionsValidTill > now;

const trueCount =
  (answersDone ? 1 : 0) +
  (followingDone ? 1 : 0) +
  (questionsDone ? 1 : 0);

  // ============ 🔹 WRITE CTR RECORD (UPSERT) 🔹 ============
let status = "not_done";

if (trueCount === 3) {
  status = "done";
} else if (trueCount === 2) {
  status = "suspicious";
}


  const ctrCheck = await QuoraCTRCheck.findOneAndUpdate(
    { quoraAccountId: account._id, date },
    {
      $set: {
        quoraAccountId: account._id,
        employeeId: taskExecution.employeeId,
        date,
        expected: {
  minAnswers24h: 1,
  following24h: true,
  questionFrequencyDays: 15,
},
        actual: {
          answersBefore: account.baselineAnswers,
          answersAfter: answers,
          newAnswersCount: answersDelta,
          upvotesDelta: 0,

          followingBefore: account.baselineFollowing,
          followingAfter: following,
          followingDelta,

          questionsBefore: account.baselineQuestions,
          questionsAfter: questions,
          questionsDelta,
        },
         activityMeta: {
  followingValidTill,
  answersValidTill,
  questionsValidTill,
},
        status,
        metadata: { apifyRunId: runId, verifiedAt: now },
      },
    },
    { upsert: true, new: true }
  );

  // Every complete observation becomes the next comparison baseline.
  {
    account.baselineFollowing = following;
    account.baselineAnswers = answers;
    account.baselineQuestions = questions;
    account.lastCheckedAt = now;
    account.baselineCapturedAt = account.lastCheckedAt;
    await account.save();
  }

  if (status === "suspicious") {
    account.status = "suspicious";
    await account.save();
  }

  return ctrCheck;
}

module.exports = { verifyQuoraCTR };
