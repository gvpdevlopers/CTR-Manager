process.env.TZ = "Asia/Kolkata";

const cron = require("node-cron");
const TaskExecution = require("../models/TaskExecution");
const InstagramCTRCheck = require("../models/InstagramCTRCheck");
const { fetchInstagramProfile } = require("../services/instagramApify.service");

/* =========================
   DATE HELPERS
========================= */
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDateNDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/* =========================
   VERIFICATION CRON
========================= */
// cron.schedule("*/2 * * * *", async () => {
cron.schedule("0 0 1 * * *", async () => {
  console.log("⏳ Instagram CTR Verification Started");

  try {
    const todayStr = getTodayDate();
    const yesterdayStr = getDateNDaysAgo(1);

    //  DEFINE start & end (THIS WAS MISSING)
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    console.log("🕒 Date range:", start.toISOString(), "→", end.toISOString());

    //  SUPPORT OLD + NEW SYSTEM
    const executions = await TaskExecution.find({
      platform: "instagram",
      taskDate: { $gte: start, $lte: end },
    }).populate("accountId employeeId");

    console.log("📦 TaskExecutions found:", executions.length);

    if (executions.length === 0) {
      console.warn("⚠️ No TaskExecution found — cron will exit");
      return;
    }

    for (const exec of executions) {
      const account = exec.accountId;
      if (!account) {
        console.warn("⚠️ accountId missing in TaskExecution");
        continue;
      }

      const employeeSubmittedAt = exec.createdAt || null;

      console.log("➡️ Verifying:", account.username);

      const data = await fetchInstagramProfile(account.username);
      if (!data) {
        console.warn("⚠️ Apify returned no data for", account.username);
        continue;
      }

      const prev = await InstagramCTRCheck.findOne({
        instagramAccountId: account._id,
        date: yesterdayStr,
      });

      const deltas = {
        followers: prev
          ? data.followersCount - (prev.snapshot?.followers || 0)
          : 0,
        posts: prev ? data.postsCount - (prev.snapshot?.posts || 0) : 0,
      };

      let status = "not_done";
      const failureReasons = [];

      const followerChange = deltas.followers;
      const postChange = deltas.posts;

      // Rule 1: If employee confirmed work → done
      if (employeeSubmittedAt) {
        status = "done";
      }

      // Rule 2: Real activity → done
      if (followerChange > 0 || postChange > 0) {
        status = "done";
      }

      // Rule 3: Negative trend → suspicious (overrides done)
      if (followerChange < 0) {
        status = "suspicious";
        failureReasons.push("Followers dropped");
      }

      await InstagramCTRCheck.updateOne(
        {
          instagramAccountId: account._id,
          date: todayStr,
        },
        {
          $set: {
            instagramAccountId: account._id,
            username: account.username,
            employeeId: exec.employeeId?._id,
            employeeSubmittedAt,

            snapshot: {
              followers: data.followersCount,
              following: data.followsCount,
              posts: data.postsCount,
              verified: data.verified,
              isBusiness: data.isBusinessAccount,
            },

            deltas,
            status,
            failureReasons,
            verifiedAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(`✅ CTR ${status.toUpperCase()} → ${account.username}`);
    }

    console.log("✅ Instagram CTR Verification Completed");
  } catch (err) {
    console.error("❌ Instagram CTR Verification Failed:", err);
  }
});
