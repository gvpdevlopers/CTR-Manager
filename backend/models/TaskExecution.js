const mongoose = require("mongoose");

const taskExecutionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // accountId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "InstagramAccount",
    //   required: true,
    // },

    // platform: {
    //   type: String,
    //   enum: ["instagram", "reddit"],
    //   default: "instagram",
    // },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstagramAccount",
      required: true,
    },

    platform: {
      type: String,
      enum: ["instagram", "reddit", "quora"],
      required: true,
    },

    taskId: {
      type: String,
      required: true,
      default: "daily_ctr",
      index: true,
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

//  Ensure uniqueness per employee + account + task + day
taskExecutionSchema.index(
  { employeeId: 1, accountId: 1, taskId: 1, taskDate: 1 },
  { unique: true }
);

module.exports = mongoose.model("TaskExecution", taskExecutionSchema);
