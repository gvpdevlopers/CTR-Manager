const RedditCTRCheck = require("../models/RedditCTRCheck");
const axios = require("axios");

async function verifyRedditCTR({ manual = false } = {}) {
  const today = new Date().toISOString().split("T")[0];

  const checks = await RedditCTRCheck.find({ date: today }).populate(
    "redditAccountId"
  );

  let updated = 0;

  for (const check of checks) {
    try {
      const usernames = [check.username1, check.username2].filter(Boolean);

      let totalComments = 0;
      let totalPosts = 0;

      for (const username of usernames) {
        const url = `https://www.reddit.com/user/${username}/about.json`;

        const res = await axios.get(url, {
          headers: {
            "User-Agent": "CTR-Monitor/1.0",
          },
        });

        totalComments += res.data.data.comment_karma || 0;
        totalPosts += res.data.data.link_karma || 0;
      }

      check.actual = {
        comments: totalComments,
        posts: totalPosts,
      };

      // basic logic (can be improved later)
      if (totalComments > 0 || totalPosts > 0) {
        check.status = "done";
      } else {
        check.status = "not_done";
      }

      await check.save();
      updated++;
    } catch (err) {
      check.status = "suspicious";
      await check.save();
    }
  }

  return {
    total: checks.length,
    updated,
    manual,
  };
}

module.exports = { verifyRedditCTR };
