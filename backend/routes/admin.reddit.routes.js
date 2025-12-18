const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../middlewares/authMiddleware");
const {
  getTodayRedditCTRStatus,
  verifyRedditNow,
} = require("../controllers/adminRedditCTR.controller");

router.get("/ctr-status", protect, isAdmin, getTodayRedditCTRStatus);
router.post("/verify-now", protect, isAdmin, verifyRedditNow);

module.exports = router;
