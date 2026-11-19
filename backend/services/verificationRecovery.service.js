const VerificationRun = require("../models/VerificationRun");
const { startRun } = require("./verificationRun.service");

// Re-enter the ordinary worker after a crashed lease expires. The worker
// prioritizes the interrupted account and reuses its saved Apify run.
async function recoverInterruptedVerifications() {
  const interrupted = await VerificationRun.find({
    _id: { $in: ["instagram", "quora"] }, status: "running", leaseUntil: { $lte: new Date() },
    actorRunId: { $ne: null }, actorTarget: { $ne: null }, actorDate: { $ne: null }, actorOperation: "verification",
  }).lean();
  for (const run of interrupted) {
    try {
      const work = run._id === "instagram"
        ? require("../cron/instagramCTR.cron").runInstagramCTRVerification
        : require("./quoraVerificationRun.service").runQuoraVerification;
      await startRun(run._id, () => work({ businessDay: run.actorDate, recoveryOnly: true }), { date: run.actorDate });
    } catch (error) { console.error(`Could not resume ${run._id} verification:`, error.message); }
  }
}

function startVerificationRecovery() {
  const timer = setInterval(() => recoverInterruptedVerifications().catch(error => console.error("Verification recovery failed:", error.message)), 60 * 1000);
  timer.unref();
  return timer;
}
module.exports = { recoverInterruptedVerifications, startVerificationRecovery };
