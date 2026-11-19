const { businessDate } = require("../utils/businessDate");
const express = require("express");
const TaskExecution = require("../models/TaskExecution");
const { claimDateRange } = require("../utils/businessDate");
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
    const today = businessDate();

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
      unavailable: 0,
    };

    const { start, end } = claimDateRange(today);
    const claims = await TaskExecution.find({ platform: "quora", taskId: "daily_ctr", taskDate: { $gte: start, $lt: end } }).populate("employeeId", "fullName username").sort({ markedDoneAt: 1 }).lean();
    const claimByAccount = new Map();
    for (const claim of claims) if (!claimByAccount.has(String(claim.accountId))) claimByAccount.set(String(claim.accountId), claim);
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
        answers: ctr.status === "unavailable" || ctr.status === "pending" ? null : `${ctr.actual?.newAnswersCount ?? 0} / ${
          ctr.expected?.minAnswers ?? 1
        }`,
        following: ctr.status === "unavailable" || ctr.status === "pending" ? null : (ctr.actual?.followingDelta ?? 0),
        questions: ctr.status === "unavailable" || ctr.status === "pending" ? null : (ctr.actual?.questionsDelta ?? 0),
        activityMeta: ctr.status === "unavailable" || ctr.status === "pending" ? null : ctr.activityMeta,
        error: ctr.metadata?.error || null,
        ctrDoneBy: ctr.employeeId?.fullName || "—",
        markedAt: claimByAccount.get(accId)?.markedDoneAt || null,
        verifiedAt: ctr.metadata?.verifiedAt || null,
      });
    }

    const missingIds = [...claimByAccount.keys()].filter((id) => !seenAccounts.has(id));
    const missingAccounts = await QuoraAccount.find({ _id: { $in: missingIds } }).select("userId").lean();
    for (const account of missingAccounts) {
      const claim = claimByAccount.get(String(account._id));
      rows.push({ _id: `claim-${account._id}`, userId: account.userId, status: "pending", following: null, answers: null, questions: null, ctrDoneBy: claim.employeeId?.fullName || claim.employeeId?.username || "?", markedAt: claim.markedDoneAt, verifiedAt: null, error: "Awaiting verification" });
      summary.total++; summary.pending++;
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
