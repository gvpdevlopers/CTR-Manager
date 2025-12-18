const RedditCTRCheck = require("../models/RedditCTRCheck");
const { verifyRedditCTR } = require("../services/redditVerify.service");

exports.getTodayRedditCTRStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const ctrChecks = await RedditCTRCheck.find({ date: today })
      .populate("employeeId", "fullName email")
      .populate("redditAccountId")
      .sort({ createdAt: -1 });

    const response = ctrChecks.map((check) => ({
      ctrCheckId: check._id,

      redditAccountId: check.redditAccountId?._id,
      usernames: {
        user1: check.username1,
        user2: check.username2,
      },

      status: check.status, // done | suspicious | not_done

      actual: check.actual,

      clickedBy: {
        employeeId: check.employeeId?._id,
        name: check.employeeId?.fullName,
        email: check.employeeId?.email,
      },

      clickedAt: check.createdAt,
      lastVerifiedAt: check.updatedAt,
    }));

    res.json(response);
  } catch (error) {
    console.error("Admin CTR fetch error:", error);
    res.status(500).json({ message: "Failed to fetch CTR status" });
  }
};

exports.verifyRedditNow = async (req, res) => {
  try {
    const result = await verifyRedditCTR({ manual: true });

    res.json({
      message: "Reddit CTR verification completed",
      result,
    });
  } catch (err) {
    console.error("Manual verify error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};
