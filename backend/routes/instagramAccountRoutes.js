const express = require("express");
const router = express.Router();
const {
  createInstagramAccount,
  getMyInstagramAccounts,
  getAllInstagramAccounts,
  updateInstagramAccount,
  toggleInstagramStatus,
  deleteInstagramAccount,
  exportInstagramCSV,
} = require("../controllers/instagramAccountController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

// ADMIN ONLY
router.get("/export/csv", protect, isAdmin, exportInstagramCSV);

// GLOBAL (ADMIN + EMPLOYEE)
router.get("/", protect, getAllInstagramAccounts);
router.post("/", protect, createInstagramAccount);

// ADMIN ONLY
router.delete("/:id", protect, isAdmin, deleteInstagramAccount);
router.patch("/:id/toggle", protect, toggleInstagramStatus);
router.put("/:id", protect, isAdmin, updateInstagramAccount);

module.exports = router;
