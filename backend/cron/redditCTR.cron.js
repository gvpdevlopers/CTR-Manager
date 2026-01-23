const cron = require("node-cron");
const RedditCTRCheck = require("../models/RedditCTRCheck");
const { verifyRedditCTR } = require("../services/redditVerify.service");

const runRedditCTRVerification = async () => {
  const today = new Date().toISOString().split("T")[0];

  console.log("[CRON] Reddit CTR verification started");

  // const pendingChecks = await RedditCTRCheck.find({
  //   date: today,
  //   status: "not_done",
  // });

  const pendingChecks = await RedditCTRCheck.find({
    date: today,
    status: { $in: ["not_done", "suspicious"] },
  });

  for (const check of pendingChecks) {
    try {
      await verifyRedditCTR(check._id);
    } catch (err) {
      console.error(
        `[CRON] Verification failed for CTRCheck ${check._id}`,
        err.message,
      );
    }
  }

  console.log(
    `[CRON] Reddit CTR verification finished (${pendingChecks.length} checks)`,
  );
  console.log("[CRON] Today:", today);

  const all = await RedditCTRCheck.find();
  console.log("[CRON] Total CTR records:", all.length);
};

// exports.startRedditCTRCron = () => {
//   // Runs once per day at 01:00 AM
//   // cron.schedule("0 1 * * *", async () => {
//   cron.schedule("*/1 * * * *", async () => {
//     await runRedditCTRVerification();
//   });
// };

exports.startRedditCTRCron = () => {
  // cron.schedule("*/1 * * * *", async () => {
  // Runs once per day at 01:00 AM
  cron.schedule("0 1 * * *", async () => {
    console.log("⏰ Reddit cron tick:", new Date().toISOString());
    await runRedditCTRVerification();
  });
};
