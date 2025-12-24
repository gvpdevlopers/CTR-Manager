const QuoraAccount = require("../models/QuoraAccount");
const QuoraCTRCheck = require("../models/QuoraCTRCheck");
const TaskExecution = require("../models/TaskExecution");
const { fetchQuoraProfileData } = require("./quoraApify.service");

/**
 * Verify Quora CTR for one account (one day)
 * Employee declaration is REQUIRED before verification
 */
async function verifyQuoraCTR(quoraAccountId, date) {
  const account = await QuoraAccount.findById(quoraAccountId);

  if (!account) {
    throw new Error("QuoraAccount not found");
  }

  if (!account.verificationEnabled) {
    return null;
  }

  /* ======================
     1️⃣ CHECK EMPLOYEE DECLARATION
  ====================== */
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  const taskExecution = await TaskExecution.findOne({
    employeeId: account.ownerEmployeeId,
    accountId: account._id,
    platform: "quora",
    taskDate,
  });

  if (!taskExecution) {
    return await QuoraCTRCheck.create({
      quoraAccountId: account._id,
      employeeId: account.ownerEmployeeId,
      date,
      status: "not_done",
      metadata: {
        error: "Employee did not mark CTR done",
      },
    });
  }

  /* ======================
     2️⃣ ENSURE BASELINE EXISTS
  ====================== */
  if (account.baselineAnswersCount === null || !account.baselineCapturedAt) {
    return await QuoraCTRCheck.create({
      quoraAccountId: account._id,
      employeeId: account.ownerEmployeeId,
      date,
      status: "pending",
      metadata: {
        error: "Baseline not captured",
      },
    });
  }

  /* ======================
     3️⃣ FETCH PUBLIC DATA (APIFY)
  ====================== */
  const apifyResult = await fetchQuoraProfileData(account.profileUrl);

  if (!apifyResult.success) {
    return await QuoraCTRCheck.create({
      quoraAccountId: account._id,
      employeeId: account.ownerEmployeeId,
      date,
      status: "pending",
      metadata: {
        error: apifyResult.error,
      },
    });
  }

  const { totalAnswers, lastAnswerDate, runId } = apifyResult;

  /* ======================
     4️⃣ CALCULATE DELTAS
  ====================== */
  const answersBefore = account.baselineAnswersCount;
  const answersAfter = totalAnswers;
  const newAnswersCount = Math.max(answersAfter - answersBefore, 0);

  /* ======================
     5️⃣ DECIDE STATUS
  ====================== */
  let status = "not_done";

  if (newAnswersCount >= 1 && lastAnswerDate) {
    const daysDiff =
      (Date.now() - new Date(lastAnswerDate)) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 15) {
      status = "done";
    }
  }

  if (newAnswersCount > 5) {
    status = "suspicious";
  }

  /* ======================
     6️⃣ SAVE CTR CHECK
  ====================== */
  const ctrCheck = await QuoraCTRCheck.create({
    quoraAccountId: account._id,
    employeeId: account.ownerEmployeeId,
    date,
    expected: {
      minAnswers: 1,
      answerFrequencyDays: 15,
    },
    actual: {
      answersBefore,
      answersAfter,
      newAnswersCount,
      lastAnswerDate,
      upvotesDelta: 0,
    },
    status,
    metadata: {
      apifyRunId: runId,
      verifiedAt: new Date(),
    },
  });

  /* ======================
     7️⃣ UPDATE BASELINE (ONLY IF DONE)
  ====================== */
  if (status === "done") {
    account.baselineAnswersCount = answersAfter;
    account.baselineLastAnswerDate = lastAnswerDate;
    account.lastCheckedAt = new Date();
    account.ctrDone = true;
    await account.save();
  }

  if (status === "suspicious") {
    account.status = "suspicious";
    await account.save();
  }

  return ctrCheck;
}

module.exports = {
  verifyQuoraCTR,
};
