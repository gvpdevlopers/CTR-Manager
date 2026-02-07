const express = require("express");
const router = express.Router();
const {
  getAdminInstagramDashboard,
  verifyInstagramNow,
} = require("../controllers/adminInstagram.controller");

const { protect, isAdmin } = require("../middlewares/authMiddleware");


router.get("/dashboard", protect, getAdminInstagramDashboard);
router.post("/verify-now", protect,isAdmin, verifyInstagramNow);

module.exports = router;
