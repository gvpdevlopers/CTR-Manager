const express = require("express");
const QuoraCTRCheck = require("../models/QuoraCTRCheck");
const QuoraAccount = require("../models/QuoraAccount");
const User = require("../models/User");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

/* =========================
   ADMIN – QUORA CTR DASHBOARD
========================= */

router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA");

    // ⛔ Gate dashboard until verification runs
const verifiedTodayExists = await QuoraCTRCheck.exists({
  date: today,
  "metadata.verifiedAt": { $exists: true },
});

if (!verifiedTodayExists) {
  return res.json({
    rows: [],
    summary: {
      total: 0,
      done: 0,
      suspicious: 0,
      not_done: 0,
      pending: 0,
    },
  });
}

    const ctrChecks = await QuoraCTRCheck.find({ date: today })
      .sort({ createdAt: -1 })
      .populate("employeeId", "fullName email")
      .populate("quoraAccountId", "userId")
      .lean();

    const rows = [];
    const summary = {
      total: 0,
      done: 0,
      suspicious: 0,
      not_done: 0,
      pending: 0,
    };

    const seenAccounts = new Set();

    for (const ctr of ctrChecks) {
      if (!ctr.quoraAccountId) continue;

      const accId = ctr.quoraAccountId._id.toString();
      if (seenAccounts.has(accId)) continue;
      seenAccounts.add(accId);

      summary.total++;
      if (summary[ctr.status] !== undefined) summary[ctr.status]++;

      rows.push({
        _id: ctr._id,
        userId: ctr.quoraAccountId.userId,
        status: ctr.status,
        answers: `${ctr.actual?.newAnswersCount ?? 0} / ${
          ctr.expected?.minAnswers ?? 1
        }`,
        following: ctr.actual?.followingDelta ?? 0,
        questions: ctr.actual?.questionsDelta ?? 0,
        ctrDoneBy: ctr.employeeId?.fullName || "—",
        verifiedAt: ctr.metadata?.verifiedAt || ctr.createdAt,
      });
    }

    return res.json({ rows, summary });
  } catch (err) {
    console.error("❌ QUORA DASHBOARD ERROR:", err);
    return res
      .status(500)
      .json({ message: "Failed to load Quora CTR dashboard" });
  }
});

module.exports = router;
