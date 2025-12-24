// require("dotenv").config();
// const mongoose = require("mongoose");
// const User = require("../models/User");
// const { hashPassword } = require("../utils/hashPassword");

// const createAdmin = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     const exists = await User.findOne({ username: "admin" });
//     if (exists) {
//       console.log("❌ Admin already exists");
//       process.exit();
//     }

//     const hashed = await hashPassword("admin123");

//     const admin = await User.create({
//       fullName: "Super Admin",
//       username: "admin",
//       passwordHash: hashed,
//       role: "admin",
//       isActive: true,
//     });

//     console.log("✅ Admin created successfully:");
//     console.log({
//       id: admin._id,
//       username: admin.username,
//       role: admin.role,
//     });

//     process.exit();
//   } catch (err) {
//     console.error("❌ Failed to create admin:", err);
//     process.exit(1);
//   }
// };

// createAdmin();
