const { businessDate, claimDateRange } = require("../utils/businessDate");
const express = require("express");
const TaskExecution = require("../models/TaskExecution");
const { protect } = require("../middlewares/authMiddleware");
const BHWCTRCheck = require("../models/BhwCTRCheck");
const { markSharedClaim } = require("../services/dailyClaim.service");


const router = express.Router();

/* =========================
   MARK CTR DONE (EMPLOYEE)
========================= */
router.post("/mark-done", protect, async (req, res) => {
  try {
    const { accountId, platform } = req.body;
    const employeeId = req.user._id;
    console.log("CTR MARK DONE BODY:", req.body);


    if (!accountId) {
      return res.status(400).json({ message: "Missing accountId" });
    }

    if (!platform) {
      return res.status(400).json({ message: "Missing platform" });
    }

    if (!["instagram", "reddit", "quora", "bhw"].includes(platform)) {
  return res.status(400).json({ message: "Invalid platform" });
}


    if (["instagram", "quora"].includes(platform)) {
      const claim = await markSharedClaim({ accountId, platform, employeeId });
      return res.json({ success: true, markedBy: claim.employeeId });
    }

    const taskId = "daily_ctr";

    const taskDate = new Date(new Date().toLocaleDateString("en-CA"));

    console.log("📝 CTR Marked:", {
      employeeId,
      accountId,
      platform,
      taskDate,
    });

    await TaskExecution.findOneAndUpdate(
      { employeeId, accountId, taskId, taskDate },
      {
        $set: {
          employeeId,
          accountId,
          taskId,
          platform,
          taskDate,
          markedDoneAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

if (platform === "bhw") {
  const today = new Date().toISOString().slice(0, 10);


  await BHWCTRCheck.findOneAndUpdate(
    { bhwAccountId: accountId, date: today },
    {
      status: "done_manual",
      meta: {
        fetchedAt: new Date(),
        source: "employee",
        error: null,
      },
    },
    { upsert: true }
  );
}

    
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ MARK DONE ERROR:", err);
    return res.status(err.status || 500).json({ message: err.status ? err.message : "CTR failed" });
  }
});

/* =========================
   RESET TODAY (DEV / ADMIN)
========================= */
router.delete("/reset-today", protect, async (req, res) => {
  try {
    const employeeId = req.user._id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    await TaskExecution.deleteMany({
      employeeId,
      platform: { $nin: ["instagram", "quora"] },
      taskDate: { $gte: start, $lte: end },
    });

    console.log("🔁 CTR Reset for employee:", employeeId);

    return res.json({ success: true });
  } catch (err) {
    console.error("RESET CTR ERROR:", err);
    return res.status(500).json({ message: "Reset failed" });
  }
});

/* =========================
   FETCH TODAY (EMPLOYEE)
========================= */
router.get("/today", protect, async (req, res) => {
  try {
    const { start, end } = claimDateRange(businessDate());
    const executions = await TaskExecution.find({
      $or: [
        { platform: { $in: ["instagram", "quora"] } },
        { employeeId: req.user._id, platform: { $nin: ["instagram", "quora"] } },
      ],
      taskId: "daily_ctr",
      taskDate: { $gte: start, $lt: end },
    }).select("accountId platform employeeId markedDoneAt")
      .populate("employeeId", "fullName username")
      .sort({ markedDoneAt: 1, _id: 1 });

    return res.json(executions);
  } catch (err) {
    console.error("❌ FETCH TODAY ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch executions" });
  }
});

module.exports = router;
