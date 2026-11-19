const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  status: { type: String, enum: ["running", "completed", "failed"], required: true },
  runId: String,
  startedAt: Date,
  finishedAt: Date,
  leaseUntil: Date,
  error: String,
  result: mongoose.Schema.Types.Mixed,
  actorRunId: String,
  actorStatus: String,
  actorUsageUsd: Number,
  actorTarget: String,
  actorDate: String,
  actorOperation: String,
  actorStartedAt: Date,
  actorFinishedAt: Date,
}, { versionKey: false });
module.exports = mongoose.model("VerificationRun", schema);
