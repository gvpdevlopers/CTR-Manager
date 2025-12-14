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

// EMPLOYEE + ADMIN CREATE
router.post("/", protect, createRedditAccount);

// EMPLOYEE
router.get("/me", protect, getMyRedditAccounts);
router.put("/:id", protect, updateRedditAccount);
router.patch("/:id/toggle", protect, toggleRedditStatus);
router.delete("/:id", protect, deleteRedditAccount);

// ADMIN
router.get("/all", protect, isAdmin, getAllRedditAccounts);
router.get("/export/csv", protect, isAdmin, exportRedditCSV);

module.exports = router;
