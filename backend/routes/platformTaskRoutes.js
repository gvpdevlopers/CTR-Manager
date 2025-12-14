const express = require("express");
const {
  createTask,
  getAllTasks,
  deleteTask,
} = require("../controllers/platformTaskController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ ADMIN CREATE
router.post("/", protect, isAdmin, createTask);

// ✅ ADMIN + EMPLOYEE READ
router.get("/", protect, getAllTasks);

// ✅ ADMIN DELETE
router.delete("/:id", protect, isAdmin, deleteTask);

module.exports = router;
