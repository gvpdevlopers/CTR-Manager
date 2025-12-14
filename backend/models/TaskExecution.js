const mongoose = require("mongoose");

const taskExecutionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InstagramAccount",
    required: true,
  },
  taskDate: { type: Date, required: true },
  markedDoneAt: { type: Date, default: Date.now },
  verifiedByAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.model("TaskExecution", taskExecutionSchema);
