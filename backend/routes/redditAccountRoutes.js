const express = require("express");
const router = express.Router();

const {
  createRedditAccount,
  getMyRedditAccounts,
  getAllRedditAccounts,
  updateRedditAccount,
  toggleRedditStatus,
  deleteRedditAccount,
  exportRedditCSV,
} = require("../controllers/redditAccountController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

// ADMIN ONLY (STATIC FIRST)
router.get("/export/csv", protect, isAdmin, exportRedditCSV);

// GLOBAL (ADMIN + EMPLOYEE)
router.get("/", protect, getAllRedditAccounts);
router.post("/", protect, createRedditAccount);

// ADMIN ONLY (DYNAMIC LAST)
router.put("/:id", protect, isAdmin, updateRedditAccount);
router.patch("/:id/toggle", protect, toggleRedditStatus);
router.delete("/:id", protect, isAdmin, deleteRedditAccount);
module.exports = router;
