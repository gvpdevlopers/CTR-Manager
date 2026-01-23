const express = require("express");
const TaskExecution = require("../models/TaskExecution");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

/* =========================
   MARK CTR DONE (EMPLOYEE)
========================= */
router.post("/mark-done", protect, async (req, res) => {
  try {
    const { accountId, platform } = req.body;
    const employeeId = req.user._id;

    if (!accountId) {
      return res.status(400).json({ message: "Missing accountId" });
    }

    if (!platform) {
      return res.status(400).json({ message: "Missing platform" });
    }

    if (!["instagram", "reddit", "quora"].includes(platform)) {
      return res.status(400).json({ message: "Invalid platform" });
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

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ MARK DONE ERROR:", err);
    return res.status(500).json({ message: "CTR failed" });
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
    const employeeId = req.user._id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const executions = await TaskExecution.find({
      employeeId,
      taskDate: { $gte: start, $lte: end },
    }).select("accountId platform");

    return res.json(executions);
  } catch (err) {
    console.error("❌ FETCH TODAY ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch executions" });
  }
});

module.exports = router;
