const mongoose = require("mongoose");

const quoraAccountSchema = new mongoose.Schema(
  {
    ownerEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userId: { type: String, required: true },

    // First User
    name1: { type: String, required: true },
    email1: { type: String, required: true },
    password1: { type: String, required: true },

    // Second User
    name2: { type: String, required: true },
    email2: { type: String, required: true },
    password2: { type: String, required: true },

    status: {
      type: String,
      enum: ["working", "suspicious", "not_working"],
      default: "working",
    },

    // Automation-ready
    lastCheckedAt: { type: Date, default: null },
    ctrDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuoraAccount", quoraAccountSchema);
