const express = require("express");
const router = express.Router();

const {
  createQuoraAccount,
  getMyQuoraAccounts,
  getAllQuoraAccounts,
  updateQuoraAccount,
  toggleQuoraStatus,
  deleteQuoraAccount,
  exportQuoraCSV,
} = require("../controllers/quoraAccountController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

// ADMIN ONLY (STATIC FIRST)
router.get("/export/csv", protect, exportQuoraCSV);

// GLOBAL (ADMIN + EMPLOYEE)
router.get("/", protect, getAllQuoraAccounts);
router.post("/", protect, createQuoraAccount);

// ADMIN ONLY (DYNAMIC LAST)
router.put("/:id", protect, updateQuoraAccount);
router.patch("/:id/toggle", protect, toggleQuoraStatus);
router.delete("/:id", protect, deleteQuoraAccount);

module.exports = router;
