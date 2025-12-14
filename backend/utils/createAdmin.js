const mongoose = require("mongoose");
const User = require("../models/User");
const { hashPassword } = require("./hashPassword");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
  const hashed = await hashPassword("admin123");

  const admin = await User.create({
    fullName: "Super Admin",
    username: "admin",
    passwordHash: hashed,
    role: "admin",
  });

  console.log("Admin Created:", admin);
  process.exit();
};

createAdmin();
