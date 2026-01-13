const mongoose = require("mongoose");

const bhwCTRCheckSchema = new mongoose.Schema(
  {
    bhwAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BHWAccount",
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
      lastSeen: { type: String, default: null },
    },

    delta: {
      messages: { type: Number, default: 0 },
      reactionScore: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["done", "partial", "not_done"],
      default: "not_done",
    },

    meta: {
      fetchedAt: { type: Date, default: Date.now },
      source: { type: String, default: "bhw_profile" },
      error: { type: String, default: null },
    },
  },
  { timestamps: true }
);

bhwCTRCheckSchema.index({ bhwAccountId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("BHWCTRCheck", bhwCTRCheckSchema);
