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

// EMPLOYEE
router.post("/", protect, createInstagramAccount);
router.get("/me", protect, getMyInstagramAccounts);
router.put("/:id", protect, updateInstagramAccount);
router.patch("/:id/toggle", protect, toggleInstagramStatus);
router.delete("/:id", protect, deleteInstagramAccount);

// ADMIN
router.get("/all", protect, isAdmin, getAllInstagramAccounts);
router.get("/export/csv", protect, isAdmin, exportInstagramCSV);

module.exports = router;
