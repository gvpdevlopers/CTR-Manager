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
    // 🔹 Get latest CTR check per account (today or most recent)
    const ctrChecks = await QuoraCTRCheck.find({})
      .sort({ createdAt: -1 })
      .populate("employeeId", "name email")
      .populate("quoraAccountId", "userId")
      .lean();

    const rows = [];
    const summary = {
      total: 0,
      done: 0,
      suspicious: 0,
      not_done: 0,
    };

    const seenAccounts = new Set();

    for (const ctr of ctrChecks) {
      const acc = ctr.quoraAccountId;
      if (!acc || seenAccounts.has(acc._id.toString())) continue;

      seenAccounts.add(acc._id.toString());
      summary.total++;

      if (summary[ctr.status] !== undefined) {
        summary[ctr.status]++;
      }

      rows.push({
        _id: ctr._id,
        userId: acc.userId,
        status: ctr.status,
        newAnswersCount: ctr.actual?.newAnswersCount ?? 0,
        ctrDoneBy: ctr.employeeId?.name || "—",
        verifiedAt: ctr.metadata?.verifiedAt || ctr.createdAt,
      });
    }

    return res.json({
      summary,
      rows,
    });
  } catch (err) {
    console.error("❌ QUORA DASHBOARD ERROR:", err);
    return res
      .status(500)
      .json({ message: "Failed to load Quora CTR dashboard" });
  }
});

module.exports = router;
