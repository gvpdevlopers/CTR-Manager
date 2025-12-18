import mongoose from "mongoose";

const RedditActivitySchema = new mongoose.Schema({
  redditId: { type: String, unique: true, index: true },
  username: { type: String, index: true },
  type: { type: String, enum: ["post", "comment"], index: true },

  subreddit: String,
  title: String, // posts only
  body: String, // comments only

  score: Number,
  permalink: String,

  createdUtc: Date,
  fetchedAt: { type: Date, default: Date.now },

  source: {
    type: String,
    default: "reddit_public_json",
  },
  trustLevel: {
    type: String,
    default: "medium",
  },
});

export default mongoose.model("RedditActivity", RedditActivitySchema);
