const express = require("express");
const {
  getAllEmployees,
  updateEmployeeStatus,
  resetEmployeePassword,
  deleteEmployee,
  createEmployee,
} = require("../controllers/adminController");

const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

//  Admin only routes

router.post("/employees", protect, isAdmin, createEmployee);

router.get("/employees", protect, isAdmin, getAllEmployees);

router.put("/employees/:id/status", protect, isAdmin, updateEmployeeStatus);

router.put(
  "/employees/:id/reset-password",
  protect,
  isAdmin,
  resetEmployeePassword
);

router.delete("/employees/:id", protect, isAdmin, deleteEmployee);

module.exports = router;
