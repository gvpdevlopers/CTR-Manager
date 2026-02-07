const QuoraAccount = require("../models/QuoraAccount");
const { verifyQuoraCTR } = require("../services/quoraCTRVerify.service");

exports.verifyQuoraNow = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA");

    const accounts = await QuoraAccount.find({
      status: { $in: ["working", "suspicious"] },
      verificationEnabled: true,
    });

    let verifiedCount = 0;

    for (const account of accounts) {
      try {
        await verifyQuoraCTR(account._id, today);
        verifiedCount++;
      } catch (err) {
        console.error(
          `Quora manual verify failed for ${account._id}`,
          err.message
        );
      }
    }

    return res.json({
      message: "Quora verification completed",
      verifiedCount,
    });
  } catch (err) {
    console.error("Manual Quora verify error:", err);
    return res.status(500).json({ message: "Quora verification failed" });
  }
};
