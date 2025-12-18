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
      user1Comments: { type: Number, default: 0 },
      user1Posts: { type: Number, default: 0 },
      user2Comments: { type: Number, default: 0 },
      user2Posts: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["done", "suspicious", "not_done"],
      default: "not_done",
    },

    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("RedditCTRCheck", redditCTRCheckSchema);
