const mongoose = require("mongoose");

const platformAccountSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    platform: {
      type: String,
      enum: ["instagram", "reddit", "quora", "bhw"],
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    profileLink: {
      type: String,
      required: true,
    },

    //  DEV ONLY - AUTO REMOVED IN PRODUCTION
    devPlatformPasswordEncrypted: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "not_active"],
      default: "active",
    },

    workingStatus: {
      type: String,
      enum: ["working", "suspicious", "not_working"],
      default: "working",
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformAccount", platformAccountSchema);
