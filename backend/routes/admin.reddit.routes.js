const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../middlewares/authMiddleware");
const {
  getTodayRedditCTRStatus,
  verifyRedditNow,
  getRedditVerificationStatus,
} = require("../controllers/adminRedditCTR.controller");

router.get("/ctr-status", protect, isAdmin, getTodayRedditCTRStatus);
router.post("/verify-now", protect, isAdmin, verifyRedditNow);
router.get("/verification-status", protect, isAdmin, getRedditVerificationStatus);

module.exports = router;
