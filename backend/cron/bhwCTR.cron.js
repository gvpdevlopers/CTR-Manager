const cron = require("node-cron");
const BHWAccount = require("../models/BhwAccount");
const BHWCTRCheck = require("../models/BhwCTRCheck");
const { fetchBHWProfile } = require("../services/bhwService");

function startBHWCTRCron() {
  cron.schedule("0 1 * * *", async () => {
    console.log("🔄 Starting BHW CTR daily check...");

    const today = formatDate(new Date());
    const yesterday = formatDate(subtractDays(new Date(), 1));

    const accounts = await BHWAccount.find({ isActive: true });

    for (const acc of accounts) {
      try {
        const profile = await fetchBHWProfile(acc.usernameSlug);

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

        let status = "not_done";
        if (deltaMessages > 0 && deltaReaction > 0) status = "done";
        else if (deltaMessages > 0 || deltaReaction > 0) status = "partial";

        await BHWCTRCheck.findOneAndUpdate(
          { bhwAccountId: acc._id, date: today },
          {
            bhwAccountId: acc._id,
            username: acc.usernameSlug,
            date: today,
            snapshot: {
              messages: profile.messages,
              reactionScore: profile.reactionScore,
              lastSeen: profile.lastSeen,
            },
            delta: {
              messages: deltaMessages,
              reactionScore: deltaReaction,
            },
            status,
            meta: {
              fetchedAt: new Date(),
              source: "bhw_profile",
            },
          },
          { upsert: true }
        );

        console.log(
          `✅ ${acc.usernameSlug}: +${deltaMessages} messages, +${deltaReaction} reactions → ${status}`
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
          { upsert: true }
        );
      }
    }

    console.log("✅ BHW CTR daily check finished.");
  });
}

module.exports = { startBHWCTRCron };
