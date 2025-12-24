const mongoose = require("mongoose");

const taskExecutionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstagramAccount",
      required: true,
    },

    platform: {
      type: String,
      enum: ["instagram", "reddit"],
      default: "instagram",
    },

    taskDate: {
      type: Date,
      required: true,
      index: true,
    },

    markedDoneAt: {
      type: Date,
      default: Date.now,
    },

    verifiedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskExecution", taskExecutionSchema);
