const express = require("express");
const { getAdminBhwDashboard } = require("../controllers/adminBhwDashboardController");

const router = express.Router();

router.get("/dashboard", getAdminBhwDashboard);

module.exports = router;