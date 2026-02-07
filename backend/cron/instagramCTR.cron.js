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

async function runInstagramCTRVerification({ manual = false } = {}) {
  console.log(
    manual
      ? "🟦 Manual Instagram CTR Verification Started"
      : "⏳ Instagram CTR Verification Started"
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const executions = await TaskExecution.find({
    platform: "instagram",
    taskDate: { $gte: start, $lte: end },
  }).populate({ path: "accountId", select: "username userName handle" });

  if (executions.length === 0) {
    console.log("⚠️ No TaskExecution found — verification exit");
    return { processed: 0 };
  }

  let processed = 0;

    for (const exec of executions) {
      // const account = exec.accountId;
      // if (!account) continue;

      // const username = account.username.trim();

      const account = exec.accountId;

      if (!account) {
        console.log("⚠️ Execution has no account — skipping");
        continue;
      }

      const username =
        account.username || account.userName || account.handle || "";

      const cleanUsername = username.trim();
      if (!cleanUsername) {
        console.log(`⚠️ Skipping account ${account._id} — username missing`);
        continue;
      }

      if (!username) {
        console.log(`⚠️ Skipping account ${account._id} — username missing`);
        continue;
      }

      const employeeSubmittedAt = exec.createdAt || null;

      console.log("➡️ Verifying:", username);

      const data = await fetchInstagramProfile(username);
      if (!data) continue;

      /* ---------- BASELINE (latest before today) ---------- */
      let baseline = await InstagramCTRCheck.findOne({
        instagramAccountId: account._id,
        date: { $lt: todayStr },
      }).sort({ date: -1 });

      // Create baseline only once
      if (!baseline) {
        console.log("🆕 Baseline stored for", username);

        await InstagramCTRCheck.updateOne(
          { instagramAccountId: account._id, date: todayStr },
          {
            $setOnInsert: {
              instagramAccountId: account._id,
              username,
              employeeId: exec.employeeId?._id,
              employeeSubmittedAt,
              snapshot: {
                followers: data.followersCount,
                following: data.followsCount,
                posts: data.postsCount,
                verified: data.verified,
                isBusiness: data.isBusinessAccount,
              },
              deltas: { following: 0, posts: 0 },
              status: "not_done",
              failureReasons: ["Baseline created"],
              verifiedAt: new Date(),
            },
          },
          { upsert: true },
        );

        continue;
      }

      /* ---------- DELTAS ---------- */
      let followingChange = 0;
      let postChange = 0;

      if (baseline.snapshot?.following !== undefined) {
        if (data.followsCount > baseline.snapshot.following) {
          followingChange = data.followsCount - baseline.snapshot.following;
        }
      }

      if (baseline.snapshot?.posts !== undefined) {
        if (data.postsCount > baseline.snapshot.posts) {
          postChange = data.postsCount - baseline.snapshot.posts;
        }
      }

      console.log("DELTA", {
        user: username,
        following: followingChange,
        posts: postChange,
      });

      /* ---------- VALIDITY WINDOWS ---------- */
const now = new Date();

let followingValidTill = null;
let postValidTill = null;

// Following valid for 24 hours
if (followingChange > 0) {
  followingValidTill = new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

// Post valid for 15 days
if (postChange > 0) {
  postValidTill = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
}


      /* ---------- STATUS ---------- */
      let status = "not_done";
const failureReasons = [];

const followingValid =
  followingChange > 0 &&
  followingValidTill &&
  followingValidTill > now;

const postValid =
  postChange > 0 &&
  postValidTill &&
  postValidTill > now;

if (followingValid && postValid) {
  status = "done";
} else if (followingValid || postValid) {
  status = "suspicious";

  if (!followingValid) {
    failureReasons.push("No recent following activity (24h)");
  }

  if (!postValid) {
    failureReasons.push("No recent post activity (15d)");
  }
}

      /* ---------- SAVE ---------- */
      await InstagramCTRCheck.updateOne(
        { instagramAccountId: account._id, date: todayStr },
        {
          $set: {
            instagramAccountId: account._id,
            username,
            employeeId: exec.employeeId?._id,
            employeeSubmittedAt,
            snapshot: {
              followers: data.followersCount,
              following: data.followsCount,
              posts: data.postsCount,
              verified: data.verified,
              isBusiness: data.isBusinessAccount,
            },
            deltas: { following: followingChange, posts: postChange },
            activityMeta: {
  followingValidTill,
  postValidTill,
},
            status,
            failureReasons,
            verifiedAt: new Date(),
          },
        },
        { upsert: true },
      );

      console.log(`✅ CTR ${status.toUpperCase()} → ${username}`);
    processed++;
  }
  console.log("✅ Instagram CTR Verification Completed");
  return { processed };
}


/* =========================
   VERIFICATION CRON
========================= */
// cron.schedule("*/1 * * * *", async () => {
  // Runs once per day at 01:00 AM
cron.schedule("0 1 * * *", async () => {
  console.log("⏳ Instagram CTR Verification Started");

  try {
    const todayStr = getTodayDate();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const executions = await TaskExecution.find({
      platform: "instagram",
      taskDate: { $gte: start, $lte: end },
    }).populate({ path: "accountId", select: "username userName handle" });

    if (executions.length === 0) {
      console.log("⚠️ No TaskExecution found — cron exit");
      return;
    }

    for (const exec of executions) {
      // const account = exec.accountId;
      // if (!account) continue;

      // const username = account.username.trim();

      const account = exec.accountId;

      if (!account) {
        console.log("⚠️ Execution has no account — skipping");
        continue;
      }

      const username =
        account.username || account.userName || account.handle || "";

      const cleanUsername = username.trim();
      if (!cleanUsername) {
        console.log(`⚠️ Skipping account ${account._id} — username missing`);
        continue;
      }

      if (!username) {
        console.log(`⚠️ Skipping account ${account._id} — username missing`);
        continue;
      }

      const employeeSubmittedAt = exec.createdAt || null;

      console.log("➡️ Verifying:", username);

      const data = await fetchInstagramProfile(username);
      if (!data) continue;

      /* ---------- BASELINE (latest before today) ---------- */
      let baseline = await InstagramCTRCheck.findOne({
        instagramAccountId: account._id,
        date: { $lt: todayStr },
      }).sort({ date: -1 });

      // Create baseline only once
      if (!baseline) {
        console.log("🆕 Baseline stored for", username);

        await InstagramCTRCheck.updateOne(
          { instagramAccountId: account._id, date: todayStr },
          {
            $setOnInsert: {
              instagramAccountId: account._id,
              username,
              employeeId: exec.employeeId?._id,
              employeeSubmittedAt,
              snapshot: {
                followers: data.followersCount,
                following: data.followsCount,
                posts: data.postsCount,
                verified: data.verified,
                isBusiness: data.isBusinessAccount,
              },
              deltas: { following: 0, posts: 0 },
              status: "not_done",
              failureReasons: ["Baseline created"],
              verifiedAt: new Date(),
            },
          },
          { upsert: true },
        );

        continue;
      }

      /* ---------- DELTAS ---------- */
      let followingChange = 0;
      let postChange = 0;

      if (baseline.snapshot?.following !== undefined) {
        if (data.followsCount > baseline.snapshot.following) {
          followingChange = data.followsCount - baseline.snapshot.following;
        }
      }

      if (baseline.snapshot?.posts !== undefined) {
        if (data.postsCount > baseline.snapshot.posts) {
          postChange = data.postsCount - baseline.snapshot.posts;
        }
      }

      console.log("DELTA", {
        user: username,
        following: followingChange,
        posts: postChange,
      });

      /* ---------- VALIDITY WINDOWS ---------- */
const now = new Date();

let followingValidTill = null;
let postValidTill = null;

// Following valid for 24 hours
if (followingChange > 0) {
  followingValidTill = new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

// Post valid for 15 days
if (postChange > 0) {
  postValidTill = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
}


      /* ---------- STATUS ---------- */
      let status = "not_done";
const failureReasons = [];

const followingValid =
  followingChange > 0 &&
  followingValidTill &&
  followingValidTill > now;

const postValid =
  postChange > 0 &&
  postValidTill &&
  postValidTill > now;

if (followingValid && postValid) {
  status = "done";
} else if (followingValid || postValid) {
  status = "suspicious";

  if (!followingValid) {
    failureReasons.push("No recent following activity (24h)");
  }

  if (!postValid) {
    failureReasons.push("No recent post activity (15d)");
  }
}

      /* ---------- SAVE ---------- */
      await InstagramCTRCheck.updateOne(
        { instagramAccountId: account._id, date: todayStr },
        {
          $set: {
            instagramAccountId: account._id,
            username,
            employeeId: exec.employeeId?._id,
            employeeSubmittedAt,
            snapshot: {
              followers: data.followersCount,
              following: data.followsCount,
              posts: data.postsCount,
              verified: data.verified,
              isBusiness: data.isBusinessAccount,
            },
            deltas: { following: followingChange, posts: postChange },
            activityMeta: {
  followingValidTill,
  postValidTill,
},
            status,
            failureReasons,
            verifiedAt: new Date(),
          },
        },
        { upsert: true },
      );

      console.log(`✅ CTR ${status.toUpperCase()} → ${username}`);
    }

    console.log("✅ Instagram CTR Verification Completed");
  } catch (err) {
    console.error("❌ Instagram CTR Verification Failed:", err);
  }
});



module.exports = { runInstagramCTRVerification };
