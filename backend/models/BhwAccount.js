const mongoose = require("mongoose");

const bhwAccountSchema = new mongoose.Schema(
  {
    ownerEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userId: { type: String, required: true },

    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    link: { type: String, required: true },

    status: {
      type: String,
      enum: ["working", "suspicious", "not_working"],
      default: "working",
    },
    bhwSlug: {
      type: String,
      required: true,
      index: true,
    },

    // Automation-ready
    lastCheckedAt: { type: Date, default: null },
    ctrDone: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BhwAccount", bhwAccountSchema);
