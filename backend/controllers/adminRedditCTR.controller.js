const RedditCTRCheck = require("../models/RedditCTRCheck");
const { verifyRedditCTR } = require("../services/redditVerify.service");

exports.getTodayRedditCTRStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const ctrChecks = await RedditCTRCheck.find({
  date: today,
  verifiedAt: { $ne: null },
})
      .populate("employeeId", "fullName email")
      .populate("redditAccountId")
      .sort({ createdAt: -1 });

    const rows = ctrChecks.map((check, index) => ({
      sr: index + 1,
      ctrCheckId: check._id,

      usernames: {
        user1: check.username1,
        user2: check.username2,
      },

      status: check.status,

      actual: check.actual,

      ctrDoneBy: check.employeeId?.fullName || "—",
      email: check.employeeId?.email || null,

      clickedAt: check.createdAt,
      lastVerifiedAt: check.updatedAt,
    }));

    const summary = {
      total: rows.length,
      done: rows.filter(r => r.status === "done").length,
      suspicious: rows.filter(r => r.status === "suspicious").length,
      not_done: rows.filter(r => r.status === "not_done").length,
    };

    return res.json({ summary, rows });

  } catch (error) {
    console.error("Admin CTR fetch error:", error);
    res.status(500).json({ message: "Failed to fetch CTR status" });
  }
};

exports.verifyRedditNow = async (req, res) => {
  try {
    await verifyRedditCTR(null, { manual: true });

    console.log("Manual verification completed");

    res.json({ message: "Verification completed" });
  } catch (err) {
    console.error("Manual verify error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};
