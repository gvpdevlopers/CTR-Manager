const InstagramCTRCheck = require("../models/InstagramCTRCheck");
const { fetchInstagramProfile } = require("../services/instagramApify.service");

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

exports.runInstagramCTRCheck = async (req, res) => {
  try {
    const { instagramAccountId, username } = req.body;
    const employeeId = req.user._id;

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // 1️⃣ Fetch Instagram data
    const data = await fetchInstagramProfile(username);

    if (!data) {
      return res.status(400).json({ message: "Instagram data not found" });
    }

    // 2️⃣ Get yesterday snapshot
    const prev = await InstagramCTRCheck.findOne({
      username,
      date: yesterday,
    });

    // 3️⃣ Calculate deltas
    const deltas = {
      followers: prev ? data.followersCount - prev.snapshot.followers : 0,
      posts: prev ? data.postsCount - prev.snapshot.posts : 0,
    };

    // 4️⃣ Decide status
    let status = "Not Working";

    if (ctr) {
      if (ctr.status === "suspicious") {
        status = "Suspicious";
      } else {
        status = "Working";
      }
    }

    // 5️⃣ Save snapshot
    const record = await InstagramCTRCheck.create({
      instagramAccountId,
      employeeId,
      username,
      date: today,

      snapshot: {
        followers: data.followersCount,
        following: data.followsCount,
        posts: data.postsCount,
        verified: data.verified,
        isBusiness: data.isBusinessAccount,
        bio: data.biography,
        profilePic: data.profilePicUrl,
      },

      deltas,
      status,
    });

    res.json({
      message: "Instagram CTR check completed",
      status,
      deltas,
      record,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Instagram CTR check failed" });
  }
};
