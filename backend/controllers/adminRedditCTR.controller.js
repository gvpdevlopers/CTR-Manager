const RedditCTRCheck = require("../models/RedditCTRCheck");
const { businessDate } = require("../utils/businessDate");
const { startRun, getRun } = require("../services/verificationRun.service");
const { runRedditCTRVerification } = require("../cron/redditCTR.cron");

exports.getTodayRedditCTRStatus = async (req, res) => {
  try {
    const checks = await RedditCTRCheck.find({ date: businessDate() })
      .populate("employeeId", "fullName username")
      .populate("redditAccountId", "userId")
      .sort({ createdAt: -1 });
    const rows = checks.map((check, index) => ({
      sr: index + 1, ctrCheckId: check._id,
      usernames: { user1: check.username1, user2: check.username2 },
      status: check.status === "not_done" && !check.verifiedAt ? "pending" : check.status,
      actual: check.status === "unavailable" || !check.verifiedAt ? null : check.actual,
      failureReasons: check.status === "unavailable" ? check.failureReasons || [] : [],
      ctrDoneBy: check.employeeId?.fullName || check.employeeId?.username || "—",
      clickedAt: check.createdAt, lastVerifiedAt: check.verifiedAt || null,
    }));
    const summary = { total: rows.length, done: 0, suspicious: 0, not_done: 0, pending: 0, unavailable: 0 };
    for (const row of rows) if (Object.hasOwn(summary, row.status)) summary[row.status]++;
    return res.json({ summary, rows });
  } catch (error) {
    console.error("Reddit dashboard error:", error.message);
    return res.status(500).json({ message: "Failed to fetch CTR status" });
  }
};

exports.verifyRedditNow = async (req, res) => {
  try {
    if (!(await startRun("reddit", runRedditCTRVerification))) return res.status(409).json({ message: "Reddit verification is already running." });
    return res.status(202).json({ message: "Reddit verification started." });
  } catch (error) {
    console.error("Could not start Reddit verification:", error.message);
    return res.status(500).json({ message: "Failed to start verification" });
  }
};

exports.getRedditVerificationStatus = async (req, res) => res.json(await getRun("reddit"));
