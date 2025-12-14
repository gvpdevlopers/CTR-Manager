const express = require("express");
const {
  createKeyword,
  getAllKeywords,
  deleteKeyword,
} = require("../controllers/keywordController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// ADMIN CREATE
router.post("/", protect, isAdmin, createKeyword);

// ADMIN + EMPLOYEE READ
router.get("/", protect, getAllKeywords);

// ADMIN DELETE
router.delete("/:id", protect, isAdmin, deleteKeyword);

module.exports = router;
