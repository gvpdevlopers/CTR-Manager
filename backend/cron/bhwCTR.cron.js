const cron = require("node-cron");
const BHWAccount = require("../models/BhwAccount");
const BHWCTRCheck = require("../models/BhwCTRCheck");
const { fetchBHWProfile } = require("../services/bhwService");

function formatDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function extractBhwSlug(profileLink) {
  const match = profileLink.match(/members\/([^/]+)\//);
  return match ? match[1] : null;
}

function startBHWCTRCron() {
  cron.schedule("0 1 * * *", async () => {
    console.log("🔄 Starting BHW CTR daily check...");

    const today = formatDate(new Date());
    const yesterday = formatDate(subtractDays(new Date(), 1));

    const accounts = await BHWAccount.find({ status: "working" });

    for (const acc of accounts) {
      try {
        const slug = extractBhwSlug(acc.link);
        if (!slug) continue;

        const profile = await fetchBHWProfile(slug);

        const prev = await BHWCTRCheck.findOne({
          bhwAccountId: acc._id,
          date: yesterday,
        });

        const deltaMessages = prev
          ? profile.messages - prev.snapshot.messages
          : 0;

        const deltaReaction = prev
          ? profile.reactionScore - prev.snapshot.reactionScore
          : 0;

        const deltaThreads = prev
          ? profile.threadsStarted - prev.snapshot.threadsStarted
          : 0;

        let status = "not_done";

        // NEW logic: any meaningful activity counts
        if (deltaMessages > 0 || deltaReaction > 0 || deltaThreads > 0) {
          status = "partial";
        }
        if (deltaMessages > 0 && deltaReaction > 0) {
          status = "done";
        }

        await BHWCTRCheck.findOneAndUpdate(
          { bhwAccountId: acc._id, date: today },
          {
            bhwAccountId: acc._id,
            username: acc.usernameSlug,
            date: today,
            snapshot: {
              messages: profile.messages,
              reactionScore: profile.reactionScore,
              threadsStarted: profile.threadsStarted,
              lastSeen: profile.lastSeen,
            },
            delta: {
              messages: deltaMessages,
              reactionScore: deltaReaction,
              threadsStarted: deltaThreads,
            },

            status,
            meta: {
              fetchedAt: new Date(),
              source: "bhw_profile",
            },
          },
          { upsert: true },
        );

        console.log(
          `✅ ${acc.usernameSlug}: +${deltaMessages} messages, +${deltaReaction} reactions → ${status}`,
        );
      } catch (err) {
        console.error(`❌ ${acc.usernameSlug} failed:`, err.message);

        await BHWCTRCheck.findOneAndUpdate(
          { bhwAccountId: acc._id, date: today },
          {
            bhwAccountId: acc._id,
            username: acc.usernameSlug,
            date: today,
            status: "not_done",
            meta: {
              fetchedAt: new Date(),
              source: "bhw_profile",
              error: err.message,
            },
          },
          { upsert: true },
        );
      }
    }

    console.log("✅ BHW CTR daily check finished.");
  });
}

module.exports = { startBHWCTRCron };
