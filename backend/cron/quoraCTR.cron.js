// cron/quoraCTR.cron.js
const cron = require("node-cron");
const QuoraAccount = require("../models/QuoraAccount");
const QuoraCTRCheck = require("../models/QuoraCTRCheck");
const { verifyQuoraCTR } = require("../services/quoraCTRVerify.service");

/**
 * Helper to get YYYY-MM-DD
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Daily Quora CTR Verification Cron
 * Runs once per day
 */
cron.schedule("0 6 * * *", async () => {
  const today = getTodayDate();
  console.log(`⏳ Quora CTR Cron Started – ${today}`);

  try {
    // Fetch all active Quora accounts
    const accounts = await QuoraAccount.find({
      status: "working",
      verificationEnabled: true,
    });

    console.log(`📦 Found ${accounts.length} Quora accounts`);

    for (const account of accounts) {
      try {
        // Prevent duplicate checks for same day
        const alreadyChecked = await QuoraCTRCheck.findOne({
          quoraAccountId: account._id,
          date: today,
        });

        if (alreadyChecked) {
          console.log(`⏭️ Skipping ${account._id} (already checked today)`);
          continue;
        }

        await verifyQuoraCTR(account._id, today);

        console.log(`✅ Verified Quora CTR for account ${account._id}`);
      } catch (accountError) {
        console.error(
          `❌ Error verifying account ${account._id}:`,
          accountError.message
        );
      }
    }

    console.log(`🏁 Quora CTR Cron Completed – ${today}`);
  } catch (err) {
    console.error("🚨 Quora CTR Cron Failed:", err.message);
  }
});
