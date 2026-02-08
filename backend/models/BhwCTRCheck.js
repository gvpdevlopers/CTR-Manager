const mongoose = require("mongoose");

const bhwCTRCheckSchema = new mongoose.Schema(
  {
    bhwAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BhwAccount",
      required: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    snapshot: {
      messages: { type: Number, default: 0 },
      reactionScore: { type: Number, default: 0 },
      threadsStarted: { type: Number, default: 0 }, 
    },

    delta: {
      messages: { type: Number, default: 0 },
      reactionScore: { type: Number, default: 0 },
      threadsStarted: { type: Number, default: 0 }, 
    },

    status: {
      type: String,
      enum: ["done", "partial", "not_done","pending", "done_manual"],
      default: "not_done",
    },

    meta: {
      fetchedAt: { type: Date, default: Date.now }, 
      source: { type: String, default: "bhw_profile" },
      error: { type: String, default: null },
    },

    retryCount: { type: Number, default: 0 },

    lastRetryAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bhwCTRCheckSchema.index({ bhwAccountId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("BHWCTRCheck", bhwCTRCheckSchema);