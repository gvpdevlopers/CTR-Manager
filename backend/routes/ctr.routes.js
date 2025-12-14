const express = require("express");
const TaskExecution = require("../models/TaskExecution");

const router = express.Router();

router.post("/mark-done", async (req, res) => {
  try {
    const { accountId, date } = req.body;

    // temporary employeeId (until auth)
    const employeeId = req.user?._id || "000000000000000000000001";

    if (!accountId || !date) {
      return res.status(400).json({ message: "Missing data" });
    }

    const taskDate = new Date(date);

    const exists = await TaskExecution.findOne({
      employeeId,
      accountId,
      taskDate,
    });

    if (exists) {
      return res.json({
        success: true,
        alreadyMarked: true,
      });
    }

    await TaskExecution.create({
      employeeId,
      accountId,
      taskDate, // ✅ FIXED FIELD NAME
    });

    res.json({ success: true });
  } catch (err) {
    console.error("CTR ERROR:", err.message);
    res.status(500).json({ message: "CTR failed" });
  }
});

// GET today's CTR
router.get("/today", async (req, res) => {
  try {
    const employeeId = req.user?._id || "000000000000000000000001";

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const records = await TaskExecution.find({
      employeeId,
      taskDate: { $gte: start, $lte: end },
    }).select("accountId");

    res.json(records);
  } catch (err) {
    console.error("FETCH TODAY CTR ERROR:", err);
    res.status(500).json({ message: "Failed to fetch CTR" });
  }
});

router.delete("/reset-today", async (req, res) => {
  const employeeId = req.user._id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await TaskExecution.deleteMany({
    employeeId,
    taskDate: today,
  });

  res.json({ success: true });
});

module.exports = router;
