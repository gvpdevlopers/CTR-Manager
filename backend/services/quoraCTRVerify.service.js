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

  if (account.verificationEnabled === false) {
    console.log("DEBUG EXIT → verification disabled");
    return null;
  }

  const existing = await QuoraCTRCheck.findOne({
    quoraAccountId: account._id,
    date,
  });

  if (existing && existing.status === "done") {
    console.log("⏭ Already DONE today — skipping");
    return existing;
  }

  console.log("🔎 Account:", account.userId);

  const taskExecution = await TaskExecution.findOne({
    accountId: account._id,
    platform: "quora",
    taskDate: {
      $gte: new Date(date + "T00:00:00.000Z"),
      $lt: new Date(date + "T23:59:59.999Z"),
    },
  });

  console.log("DEBUG: taskExecution =", !!taskExecution);

  if (!taskExecution) {
    console.log("DEBUG EXIT → no taskExecution");
    return await QuoraCTRCheck.create({
      quoraAccountId: account._id,
      employeeId: account.ownerEmployeeId,
      date,
      status: "not_done",
      metadata: { error: "Employee did not mark CTR done" },
    });
  }

  console.log("DEBUG: baseline =", {
    following: account.baselineFollowing,
    answers: account.baselineAnswers,
    questions: account.baselineQuestions,
  });

  if (
    account.baselineFollowing == null ||
    account.baselineAnswers == null ||
    account.baselineQuestions == null
  ) {
    console.log("DEBUG EXIT → baseline missing");
    return await QuoraCTRCheck.create({
      quoraAccountId: account._id,
      employeeId: account.ownerEmployeeId,
      date,
      status: "pending",
      metadata: { error: "Baseline not captured" },
    });
  }

  console.log("DEBUG → calling Apify");

  const apifyResult = await fetchQuoraProfileData(account.profileUrl);
  console.log("DEBUG: apifyResult =", apifyResult);

  if (!apifyResult.success) {
    console.log("DEBUG EXIT → apify failed");
    return await QuoraCTRCheck.create({
      quoraAccountId: account._id,
      employeeId: account.ownerEmployeeId,
      date,
      status: "pending",
      metadata: { error: apifyResult.error },
    });
  }

  const { following, answers, questions, runId } = apifyResult;

  // 🚫 Defensive: reject silent zero responses
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

  let status = "not_done";

  if (answersDelta >= 1 || followingDelta >= 1 || questionsDelta >= 1) {
    status = "done";
  }

  if (answersDelta > 10 || followingDelta > 15 || questionsDelta > 5) {
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
          minAnswers: 1,
          answerFrequencyDays: 15,
        },
        actual: {
          answersBefore: account.baselineAnswers,
          answersAfter: answers,
          newAnswersCount: answersDelta,
          lastAnswerDate: null,
          upvotesDelta: 0,

          followingBefore: account.baselineFollowing,
          followingAfter: following,
          followingDelta,

          questionsBefore: account.baselineQuestions,
          questionsAfter: questions,
          questionsDelta,
        },
        status,
        metadata: {
          apifyRunId: runId,
          verifiedAt: new Date(),
        },
      },
    },
    { upsert: true, new: true }
  );

  // ✅ Only update baseline if values are valid
  if (status === "done" && following > 0 && answers > 0 && questions > 0) {
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
