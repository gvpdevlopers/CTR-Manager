const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    appEnvironment: {
      type: String,
      enum: ["development", "production"],
      default: "development",
    },

    allowDevPasswords: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
