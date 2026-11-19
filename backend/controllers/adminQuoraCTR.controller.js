const { runQuoraVerification } = require("../services/quoraVerificationRun.service");
const { startRun, getRun } = require("../services/verificationRun.service");

exports.verifyQuoraNow = async (req, res) => {
  const started = await startRun("quora", runQuoraVerification);
  if (!started) return res.status(409).json({ message: "Quora verification is already running." });
  return res.status(202).json({ message: "Quora verification started." });
};

exports.getQuoraVerificationStatus = async (req, res) => res.json(await getRun("quora"));
