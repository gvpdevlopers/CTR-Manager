const QuoraAccount = require("../models/QuoraAccount");
const QuoraCTRCheck = require("../models/QuoraCTRCheck");
const TaskExecution = require("../models/TaskExecution");
const { fetchQuoraProfileData } = require("./quoraApify.service");

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

  if (existing && existing.status === "done") {
    console.log("⏭ Already DONE today — skipping");
    return existing;
  }

  console.log("🔎 Account:", account.userId);

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const taskExecution = await TaskExecution.findOne({
    accountId: account._id,
    platform: "quora",
    taskDate: { $gte: start, $lt: end },
  });

  console.log("DEBUG: taskExecution =", !!taskExecution);

  // 1️⃣ Employee did not mark CTR
  if (!taskExecution) {
    console.log("DEBUG EXIT → no taskExecution");
    return await QuoraCTRCheck.findOneAndUpdate(
      { quoraAccountId: account._id, date },
      {
        $set: {
          quoraAccountId: account._id,
          employeeId: account.ownerEmployeeId,
          date,
          status: "not_done",
          metadata: { error: "Employee did not mark CTR done" },
        },
      },
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
          status: "pending",
          metadata: { error: apifyResult.error },
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
          status: "pending",
          metadata: {
            apifyRunId: runId,
            error: "Apify returned zeroed metrics",
            verifiedAt: new Date(),
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

  const now = new Date();

let followingValidTill = null;
let answersValidTill = null;
let questionsValidTill = null;

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
        metadata: { apifyRunId: runId, verifiedAt: new Date() },
      },
    },
    { upsert: true, new: true }
  );

  // Update baseline only when fully done
  if (status === "done") {
    account.baselineFollowing = following;
    account.baselineAnswers = answers;
    account.baselineQuestions = questions;
    account.lastCheckedAt = new Date();
    await account.save();
  }

  if (status === "suspicious") {
    account.status = "suspicious";
    await account.save();
  }

  return ctrCheck;
}

module.exports = { verifyQuoraCTR };
