const User = require("../models/User");
const { hashPassword } = require("../utils/hashPassword");

exports.createEmployee = async (req, res) => {
  try {
    const { fullName, username, password } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashed = await hashPassword(password);

    const employee = await User.create({
      fullName,
      username,
      passwordHash: hashed,
      role: "employee",
      createdByAdminId: req.user._id,
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        username: employee.username,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create employee" });
  }
};

//  Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select(
      "-passwordHash"
    );
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

//  Activate / Deactivate employee
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({
      message: "Employee status updated",
      isActive: employee.isActive,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update employee status" });
  }
};

//  Reset employee password
exports.resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const employee = await User.findById(id);
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }

    const newHashed = await hashPassword(newPassword);
    employee.passwordHash = newHashed;
    await employee.save();

    res.json({ message: "Employee password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset password" });
  }
};

//  Delete employee (optional but recommended)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.deleteOne();
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee" });
  }
};
