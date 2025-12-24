const express = require("express");
const router = express.Router();
const {
  getAdminInstagramDashboard,
} = require("../controllers/adminInstagram.controller");
const { protect } = require("../middlewares/authMiddleware");

router.get("/dashboard", protect, getAdminInstagramDashboard);

module.exports = router;
