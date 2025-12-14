const express = require("express");
const {
  addPlatformAccount,
  getMyPlatformAccounts,
  updateMyPlatformAccount,
  deleteMyPlatformAccount,
  getAllPlatformAccounts,
} = require("../controllers/platformAccountController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

//  EMPLOYEE ROUTES
router.post("/", protect, addPlatformAccount);
router.get("/me", protect, getMyPlatformAccounts);
router.put("/me/:id", protect, updateMyPlatformAccount);
router.delete("/me/:id", protect, deleteMyPlatformAccount);

//  ADMIN ROUTE
router.get("/all", protect, isAdmin, getAllPlatformAccounts);

module.exports = router;
