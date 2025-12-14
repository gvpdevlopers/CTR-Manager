const mongoose = require("mongoose");

const platformTaskSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["instagram", "reddit", "quora", "bhw"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    keywordOrTask: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "general",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformTask", platformTaskSchema);
