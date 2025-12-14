const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const generateToken = require("../utils/generateToken");

// ✅ LOGIN (Admin + Employee)
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ message: "Invalid credentials or user inactive" });
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      token: generateToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN CREATES EMPLOYEE
exports.createEmployee = async (req, res) => {
  try {
    const { fullName, username, password } = req.body;

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashed = await hashPassword(password);

    const user = await User.create({
      fullName,
      username,
      passwordHash: hashed,
      role: "employee",
      createdByAdminId: req.user._id,
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
