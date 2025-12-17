const express = require("express");
const router = express.Router();

const {
  createBhwAccount,
  getMyBhwAccounts,
  getAllBhwAccounts,
  updateBhwAccount,
  toggleBhwStatus,
  deleteBhwAccount,
  exportBhwCSV,
} = require("../controllers/bhwAccountController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

// ADMIN ONLY (STATIC FIRST)
router.get("/export/csv", protect, isAdmin, exportBhwCSV);

// GLOBAL (ADMIN + EMPLOYEE)
router.get("/", protect, getAllBhwAccounts);
router.post("/", protect, createBhwAccount);

// ADMIN ONLY (DYNAMIC LAST)
router.put("/:id", protect, isAdmin, updateBhwAccount);
router.patch("/:id/toggle", protect, toggleBhwStatus);
router.delete("/:id", protect, isAdmin, deleteBhwAccount);

module.exports = router;
