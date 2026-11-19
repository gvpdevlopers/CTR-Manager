const { businessDate, claimDateRange } = require("../utils/businessDate");
const TaskExecution = require("../models/TaskExecution");
const QuoraAccount = require("../models/QuoraAccount");
const { verifyQuoraCTR } = require("./quoraCTRVerify.service");
const { getRecoveryTarget } = require("./verificationRun.service");

async function runQuoraVerification({ businessDay = null, recoveryOnly = false } = {}) {
  const today = businessDay || businessDate();
  const { start, end } = claimDateRange(today);
  const claims = await TaskExecution.find({ platform: "quora", taskId: "daily_ctr", taskDate: { $gte: start, $lt: end } }).select("accountId").lean();
  const ids = [...new Set(claims.map(claim => String(claim.accountId)))];
  const accounts = await QuoraAccount.find({ _id: { $in: ids }, verificationEnabled: { $ne: false } }).select("_id profileUrl").lean();
  const recoveryTarget = getRecoveryTarget();
  if (recoveryTarget) accounts.sort((a, b) => Number(b.profileUrl === recoveryTarget) - Number(a.profileUrl === recoveryTarget));
  let failed = 0;
  for (const account of accounts) {
    if (recoveryOnly && account.profileUrl !== recoveryTarget) continue;
    try { await verifyQuoraCTR(account._id, today); }
    catch (error) { failed++; console.error("Quora verification failed:", account._id, error.message); }
  }
  if (failed) throw new Error(`${failed} Quora account(s) could not be checked`);
  return { eligibleClaims: accounts.length };
}

module.exports = { runQuoraVerification };
