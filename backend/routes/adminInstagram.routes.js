const express = require("express");
const router = express.Router();
const {
  getAdminInstagramDashboard,
  verifyInstagramNow,
  getInstagramVerificationStatus,
} = require("../controllers/adminInstagram.controller");

const { protect, isAdmin } = require("../middlewares/authMiddleware");


router.get("/dashboard", protect, getAdminInstagramDashboard);
router.post("/verify-now", protect,isAdmin, verifyInstagramNow);
router.get("/verification-status", protect, isAdmin, getInstagramVerificationStatus);

module.exports = router;
