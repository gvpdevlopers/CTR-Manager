const crypto = require("crypto");
const mongoose = require("mongoose");
const RedditAccount = require("../models/RedditAccount");
const RedditCTRCheck = require("../models/RedditCTRCheck");
const { businessDate } = require("../utils/businessDate");

exports.markCTRDone = async (req, res) => {
  try {
    const { redditAccountId } = req.body;
    if (!mongoose.isValidObjectId(redditAccountId)) return res.status(400).json({ message: "A valid Reddit account is required" });
    const account = await RedditAccount.findById(redditAccountId);
    if (!account) return res.status(404).json({ message: "Reddit account not found" });
    const date = businessDate();
    const existing = await RedditCTRCheck.findOne({ redditAccountId, date }).sort({ createdAt: 1 });
    if (existing) return res.json({ message: "CTR was already marked today", ctrCheckId: existing._id, markedBy: existing.employeeId });
    const accountId = new mongoose.Types.ObjectId(redditAccountId).toHexString();
    const id = new mongoose.Types.ObjectId(crypto.createHash("sha256").update(`reddit:${accountId}:daily_ctr:${date}`).digest("hex").slice(0, 24));
    let check;
    try {
      check = await RedditCTRCheck.findOneAndUpdate({ _id: id }, { $setOnInsert: {
        redditAccountId: account._id, employeeId: req.user._id, username1: account.name1, username2: account.name2, date,
        expected: { comments: account.expectedComments ?? 2, posts: account.expectedPosts ?? 1 }, status: "pending",
      } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      check = await RedditCTRCheck.findById(id);
      if (!check) throw error;
    }
    return res.status(200).json({ message: "CTR marked successfully", ctrCheckId: check._id, markedBy: check.employeeId });
  } catch (error) {
    console.error("Reddit CTR claim failed:", error.message);
    return res.status(500).json({ message: "Failed to mark CTR" });
  }
};

exports.getMyTodayCTR = async (req, res) => {
  try {
    const records = await RedditCTRCheck.find({ date: businessDate() }).select("redditAccountId employeeId status").populate("employeeId", "fullName username").lean();
    return res.json(records);
  } catch (error) {
    console.error("Reddit CTR claims fetch failed:", error.message);
    return res.status(500).json({ message: "Failed to fetch today's CTR claims" });
  }
};
