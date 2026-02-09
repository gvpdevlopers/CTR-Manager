const mongoose = require("mongoose");

const instagramCTRCheckSchema = new mongoose.Schema(
  {
    instagramAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstagramAccount",
      required: true,
    },

    employeeSubmittedAt: {
      type: Date,
      default: null,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    username: {
      type: String,
      required: true,
      index: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },

    snapshot: {
  followers: Number,
  following: Number,
  posts: Number,

  postMeta: [
    {
      postId: String,
      createdAt: Date,
    },
  ],
},

    deltas: {
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["done", "not_done", "suspicious"],
      default: "not_done",
    },

    failureReasons: {
      type: [String],
      default: [],
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate daily records
instagramCTRCheckSchema.index({ username: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("InstagramCTRCheck", instagramCTRCheckSchema);
