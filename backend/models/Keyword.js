const mongoose = require("mongoose");

const keywordSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["instagram", "reddit", "quora", "bhw"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Keyword", keywordSchema);
