const cron = require("node-cron");
const RedditCTRCheck = require("../models/RedditCTRCheck");
const { verifyRedditCTR } = require("../services/redditVerify.service");
const { startRun } = require("../services/verificationRun.service");
const { businessDate, BUSINESS_TIMEZONE } = require("../utils/businessDate");
const { shouldVerify } = require("../services/verificationEligibility");

async function runRedditCTRVerification() {
  const checks = await RedditCTRCheck.find({ date: businessDate() });
  let processed = 0;
  let failed = 0;
  for (const check of checks) {
    const legacyPending = check.status === "not_done" && !check.verifiedAt;
    if (!legacyPending && !shouldVerify(check)) continue;
    try { await verifyRedditCTR(check._id); processed++; }
    catch (error) { failed++; console.error("Reddit verification failed:", error.message); }
  }
  if (failed) throw new Error(`${failed} Reddit account(s) could not be checked`);
  return { processed };
}

function startRedditCTRCron() {
  return cron.schedule("0 23 * * *", async () => {
    try {
      if (!(await startRun("reddit", runRedditCTRVerification))) console.log("Reddit verification already running; scheduled run skipped");
    } catch (error) { console.error("Could not start scheduled Reddit verification:", error.message); }
  }, { timezone: BUSINESS_TIMEZONE });
}

module.exports = { startRedditCTRCron, runRedditCTRVerification };
