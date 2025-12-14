const mongoose = require("mongoose");

const platformStatHistorySchema = new mongoose.Schema(
  {
    platformAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformAccount",
      required: true,
    },

    statType: {
      type: String,
      enum: [
        "followers",
        "following",
        "karma",
        "posts",
        "answers",
        "bhw_posts",
      ],
      required: true,
    },

    oldValue: {
      type: Number,
      default: 0,
    },

    newValue: {
      type: Number,
      default: 0,
    },

    statDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PlatformStatHistory",
  platformStatHistorySchema
);
