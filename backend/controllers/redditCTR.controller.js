const RedditAccount = require("../models/RedditAccount");
const RedditCTRCheck = require("../models/RedditCTRCheck");

exports.markCTRDone = async (req, res) => {
  console.log("🔥 markCTRDone HIT");
  console.log("BODY:", req.body);
  console.log("USER:", req.user);
  try {
    const employeeId = req.user._id; // from auth middleware
    const { redditAccountId } = req.body;

    if (!redditAccountId) {
      return res.status(400).json({ message: "RedditAccount ID required" });
    }

    // 1️⃣ Fetch Reddit Account
    const redditAccount = await RedditAccount.findById(redditAccountId);
    if (!redditAccount) {
      return res.status(404).json({ message: "Reddit account not found" });
    }

    // 2️⃣ Prevent duplicate CTR Done for same day
    const today = new Date().toISOString().split("T")[0];

    const existingCheck = await RedditCTRCheck.findOne({
      redditAccountId,
      date: today,
    });

    if (existingCheck) {
      return res.status(409).json({
        message: "CTR already marked for today",
      });
    }

    // 3️⃣ Create CTR Verification Record
    const ctrCheck = await RedditCTRCheck.create({
      redditAccountId,
      employeeId,
      username1: redditAccount.name1,
      username2: redditAccount.name2,
      date: today,

      expected: {
        comments: redditAccount.expectedComments || 2,
        posts: redditAccount.expectedPosts || 1,
      },

      status: "not_done",
    });

    // 4️⃣ Update RedditAccount (UI sync)
    redditAccount.ctrDone = true;
    redditAccount.lastCheckedAt = new Date();
    await redditAccount.save();

    return res.status(201).json({
      message: "CTR marked successfully",
      ctrCheckId: ctrCheck._id,
    });
  } catch (error) {
    console.error("CTR Done Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMyTodayCTR = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    const records = await RedditCTRCheck.find({
      employeeId,
      date: today,
    }).select("redditAccountId status");

    res.json(records);
  } catch (err) {
    console.error("My CTR fetch error:", err);
    res.status(500).json({ message: "Failed to fetch today CTR" });
  }
};
