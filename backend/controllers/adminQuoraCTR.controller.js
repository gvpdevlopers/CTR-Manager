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
        const result = await verifyQuoraCTR(account._id, today);
        if (result) verifiedCount++;
      } catch (err) {
        console.error(
          `Quora manual verify failed for ${account._id}`,
          err.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      verifiedCount,
      message: "Quora verification completed",
    });
  } catch (err) {
    console.error("Manual Quora verify error:", err);
    return res.status(500).json({
      success: false,
      message: "Quora verification failed",
    });
  }
};

