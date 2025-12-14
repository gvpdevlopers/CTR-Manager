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

// EMPLOYEE + ADMIN CREATE
router.post("/", protect, createQuoraAccount);

// EMPLOYEE
router.get("/me", protect, getMyQuoraAccounts);
router.put("/:id", protect, updateQuoraAccount);
router.patch("/:id/toggle", protect, toggleQuoraStatus);
router.delete("/:id", protect, deleteQuoraAccount);

// ADMIN
router.get("/all", protect, isAdmin, getAllQuoraAccounts);
router.get("/export/csv", protect, isAdmin, exportQuoraCSV);

module.exports = router;
