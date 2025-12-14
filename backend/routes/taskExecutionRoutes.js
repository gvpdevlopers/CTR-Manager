const express = require("express");
const {
  markTaskDone,
  getTodayExecutions,
  adminResetExecution,
} = require("../controllers/taskExecutionController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Employee marks CTR
router.post("/mark-done", protect, markTaskDone);

// Employee fetches today status
router.get("/today", protect, getTodayExecutions);

// Admin reset
router.delete("/:id", protect, isAdmin, adminResetExecution);

module.exports = router;
