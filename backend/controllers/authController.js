const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const generateToken = require("../utils/generateToken");

// ===========================
// LOGIN (Admin + Employee)
// ===========================
exports.loginUser = async (req, res) => {
  try {
    let { username, password } = req.body;

    // Sanitize input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    username = username.trim();
    password = password.trim();

    // console.log("LOGIN ATTEMPT:", username);
    // console.log("PASSWORD LENGTH:", password.length);

    const user = await User.findOne({ username });
    // console.log("USER FOUND:", user ? user.role : "none");

    if (!user || !user.isActive) {
      // console.log("FAILED: user missing or inactive");
      return res.status(401).json({
        message: "Invalid credentials or user inactive",
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    // console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      // console.log("FAILED: password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log("TOKEN GENERATED");

    user.lastLogin = new Date();
    await user.save();

    return res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===========================
// ADMIN CREATES EMPLOYEE
// ===========================
exports.createEmployee = async (req, res) => {
  try {
    let { fullName, username, password } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    username = username.trim();
    password = password.replace(/\s/g, "");
    fullName = fullName.trim();

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

    return res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("CREATE EMPLOYEE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
