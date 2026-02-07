const cron = require("node-cron");
const QuoraAccount = require("../models/QuoraAccount");
const QuoraCTRCheck = require("../models/QuoraCTRCheck");
const { verifyQuoraCTR } = require("../services/quoraCTRVerify.service");

function startQuoraCTRCron() {
  // console.log("Starting Quora CTR Cron...");
  // cron.schedule("*/1 * * * *", async () => {
  // Runs once per day at 01:00 AM
  cron.schedule("0 1 * * *", async () => {
    const today = new Date().toLocaleDateString("en-CA");

    console.log(`⏳ Quora CTR Cron Started – ${today}`);

    try {
      const accounts = await QuoraAccount.find({
        status: { $in: ["working", "suspicious"] },
        verificationEnabled: true,
      });

      console.log(`📦 Found ${accounts.length} Quora accounts`);

      // for (const account of accounts) {
      //   console.log(`🔍 Checking ${account.userId}`);

      //   try {
      //     const alreadyChecked = await QuoraCTRCheck.findOne({
      //       quoraAccountId: account._id,
      //       date: today,
      //     });

      //     if (alreadyChecked) {
      //       console.log(`⏭ Already verified today`);
      //       continue;
      //     }

      //     await verifyQuoraCTR(account._id, today);
      //   } catch (accErr) {
      //     console.error(
      //       `❌ Error verifying ${account.userId}:`,
      //       accErr.message
      //     );
      //   }
      // }

      // for (const account of accounts) {
      //   await verifyQuoraCTR(account._id, today);
      // }

      for (const account of accounts) {
        const alreadyChecked = await QuoraCTRCheck.findOne({
          quoraAccountId: account._id,
          date: today,
          status: "done",
        });

        if (alreadyChecked) {
          console.log(`⏭ Already verified today (DONE)`);
          continue;
        }

        await verifyQuoraCTR(account._id, today);
      }

      console.log(`🏁 Quora CTR Cron Completed – ${today}`);
    } catch (err) {
      console.error("🚨 Quora CTR Cron Failed:", err.message);
    }
  });
}

module.exports = { startQuoraCTRCron };
