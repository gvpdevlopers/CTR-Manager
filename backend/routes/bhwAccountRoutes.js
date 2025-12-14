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

// EMPLOYEE + ADMIN CREATE
router.post("/", protect, createBhwAccount);

// EMPLOYEE
router.get("/me", protect, getMyBhwAccounts);
router.put("/:id", protect, updateBhwAccount);
router.patch("/:id/toggle", protect, toggleBhwStatus);
router.delete("/:id", protect, deleteBhwAccount);

// ADMIN
router.get("/all", protect, isAdmin, getAllBhwAccounts);
router.get("/export/csv", protect, isAdmin, exportBhwCSV);

module.exports = router;
