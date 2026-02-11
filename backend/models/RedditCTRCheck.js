const mongoose = require("mongoose");

const redditCTRCheckSchema = new mongoose.Schema(
  {
    redditAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RedditAccount",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // usernames checked (from name1 & name2)
    username1: String,
    username2: String,

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    expected: {
      comments: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
    },

    actual: {
      breakdown: {
        user1: {
          comments24h: { type: Number, default: 0 },
          posts24h: { type: Number, default: 0 },
        },
        user2: {
          comments24h: { type: Number, default: 0 },
          posts24h: { type: Number, default: 0 },
        },
      },

      comments24h: { type: Number, default: 0 },
      commentsRequired: { type: Number, default: 0 },

      postDone: { type: Boolean, default: false },
      postValidTill: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ["done", "suspicious", "not_done"],
      default: "not_done",
    },
    verifiedAt: {
    type: Date,
    default: null,
  },

    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("RedditCTRCheck", redditCTRCheckSchema);
