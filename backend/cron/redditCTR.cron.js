const cron = require("node-cron");
const RedditCTRCheck = require("../models/RedditCTRCheck");
const { verifyRedditCTR } = require("../services/redditCTRVerifier");

const runRedditCTRVerification = async () => {
  const today = new Date().toISOString().split("T")[0];

  console.log("[CRON] Reddit CTR verification started");

  const pendingChecks = await RedditCTRCheck.find({
    date: today,
    status: "not_done",
  });

  for (const check of pendingChecks) {
    try {
      await verifyRedditCTR(check._id);
    } catch (err) {
      console.error(
        `[CRON] Verification failed for CTRCheck ${check._id}`,
        err.message
      );
    }
  }

  console.log(
    `[CRON] Reddit CTR verification finished (${pendingChecks.length} checks)`
  );
  console.log("[CRON] Today:", today);

  const all = await RedditCTRCheck.find();
  console.log("[CRON] Total CTR records:", all.length);
};

exports.startRedditCTRCron = () => {
  // Runs every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    await runRedditCTRVerification();
  });
};
