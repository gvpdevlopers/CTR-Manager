const QuoraAccount = require("../models/QuoraAccount");
const { verifyQuoraCTR } = require("../services/quoraCTRVerify.service");

exports.verifyQuoraNow = async (req, res) => {
  try {
    // DO NOT await (prevents timeout)
    runQuoraCTRVerification({ manual: true })
      .then(result => {
        console.log("Manual Quora verification finished:", result);
      })
      .catch(err => {
        console.error("Manual Quora verification error:", err);
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


