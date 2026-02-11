const QuoraAccount = require("../models/QuoraAccount");
const { verifyQuoraCTR } = require("../services/quoraCTRVerify.service");

exports.verifyQuoraNow = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const accounts = await QuoraAccount.find({
      verificationEnabled: { $ne: false },
    });

    // Run async without blocking response
    accounts.forEach(account => {
      verifyQuoraCTR(account._id, today)
        .then(() => {
          console.log("Verified:", account.userId);
        })
        .catch(err => {
          console.error("Verification error:", account.userId, err.message);
        });
    });

    return res.status(200).json({
      success: true,
      message: "Quora verification started. Please refresh after a few seconds.",
    });

  } catch (err) {
    console.error("Manual Quora verify error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to start verification",
    });
  }
};
