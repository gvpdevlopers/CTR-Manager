const cron = require("node-cron");
const { BUSINESS_TIMEZONE } = require("../utils/businessDate");
const { startRun } = require("../services/verificationRun.service");
const { runQuoraVerification } = require("../services/quoraVerificationRun.service");

function startQuoraCTRCron() {
  return cron.schedule("0 23 * * *", async () => {
    try {
      if (!(await startRun("quora", runQuoraVerification))) {
        console.log("Quora verification already running; scheduled run skipped");
      }
    } catch (error) { console.error("Could not start scheduled Quora verification:", error.message); }
  }, { timezone: BUSINESS_TIMEZONE });
}

module.exports = { startQuoraCTRCron };
