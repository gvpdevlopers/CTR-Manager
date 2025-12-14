const express = require("express");
const { loginUser, createEmployee } = require("../controllers/authController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", loginUser); // Admin + Employee login
router.post("/create-employee", protect, isAdmin, createEmployee); // Admin creates employee

module.exports = router;
