const RedditCTRCheck = require("../models/RedditCTRCheck");
const axios = require("axios");

const COMMENT_REQUIRED_24H = 2;
const POST_VALID_DAYS = 15;
const MS_24_HOURS = 24 * 60 * 60 * 1000;

const isWithinLast24Hours = (utc) => Date.now() - utc * 1000 <= MS_24_HOURS;

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// async function verifyRedditCTR(ctrCheckId = null, { manual = false } = {}) {
//   console.log("⚠️ Reddit verification temporarily disabled");
//   return { total: 0, manual };
// }

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function toIST(date) {
  return new Date(date.getTime() + IST_OFFSET);
}

function isTodayIST(createdUtc) {
  const created = toIST(new Date(createdUtc * 1000));
  const now = toIST(new Date());

  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

function isWithinLastNDaysIST(createdUtc, days) {
  const created = toIST(new Date(createdUtc * 1000));
  const now = toIST(new Date());

  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - created.setHours(0, 0, 0, 0)) /
      (24 * 60 * 60 * 1000)
  );

  return diffDays >= 0 && diffDays < days;
}

async function verifyRedditCTR(ctrCheckId = null, { manual = false } = {}) {
  const today = new Date().toISOString().split("T")[0];

  const checks = ctrCheckId
    ? await RedditCTRCheck.find({ _id: ctrCheckId })
    : await RedditCTRCheck.find({ date: today });

  for (const check of checks) {
    const users = [
  check.username1?.trim(),
  check.username2?.trim(),
].filter(Boolean);

const expectedComments = users.length * COMMENT_REQUIRED_24H;

    const expectedPosts = check.expected?.posts ?? 0;

    let totalComments24h = 0;
    let postValidTill = check.actual?.postValidTill || null;

    const breakdown = {
      user1: { comments24h: 0, posts24h: 0 },
      user2: { comments24h: 0, posts24h: 0 },
    };

    try {
      const users = [
        { name: check.username1?.trim(), key: "user1" },
        { name: check.username2?.trim(), key: "user2" },
      ].filter((u) => u.name && u.name.length > 0);

      for (const u of users) {
        // COMMENTS
        try {
          const commentsRes = await axios.get(
            `https://www.reddit.com/user/${u.name}/comments.json?limit=50&sort=new&t=day`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; CTRMonitor/1.0)",
              },
            }
          );

          const recentComments = commentsRes.data.data.children.filter((c) =>
            isTodayIST(c.data.created_utc)
          );

          breakdown[u.key].comments24h = recentComments.length;
          totalComments24h += recentComments.length;
        } catch (err) {
          console.warn("Comments fetch failed:", u.name, err.response?.status);
        }

        // POSTS
        try {
          const postsRes = await axios.get(
            `https://www.reddit.com/user/${u.name}/submitted.json?limit=20&sort=new&t=week`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; CTRMonitor/1.0)",
              },
            }
          );

          const hasRecentPost = postsRes.data.data.children.some((p) =>
            isWithinLastNDaysIST(p.data.created_utc, POST_VALID_DAYS)
          );

          breakdown[u.key].posts24h = postsRes.data.data.children.length;

          if (hasRecentPost) postValidTill = daysFromNow(POST_VALID_DAYS);
        } catch (err) {
          console.warn("Posts fetch failed:", u.name, err.response?.status);
        }
      }

      // const commentsOk = totalComments24h >= expectedComments;
      // const postsOk =
      //   breakdown.user1.posts24h + breakdown.user2.posts24h >= expectedPosts;

      // let newStatus = "not_done";
      // if (commentsOk && postsOk) newStatus = "done";
      // else if (commentsOk || postsOk) newStatus = "suspicious";

      const totalPosts = breakdown.user1.posts24h + breakdown.user2.posts24h;

      // Guard: if nothing expected and nothing done → not_done
      if (
        expectedComments === 0 &&
        expectedPosts === 0 &&
        totalComments24h === 0 &&
        totalPosts === 0
      ) {
        check.status = "not_done";
      } else {
        const commentsOk =
          expectedComments > 0 && totalComments24h >= expectedComments;

        const postsOk = expectedPosts > 0 && totalPosts >= expectedPosts;

        if (commentsOk && postsOk) check.status = "done";
        else if (commentsOk || postsOk) check.status = "suspicious";
        else check.status = "not_done";
      }

      check.actual = {
        breakdown,
        comments24h: totalComments24h,
        commentsRequired: expectedComments,
        postDone: Boolean(postValidTill),
        postValidTill,
      };

      // check.status = newStatus;
      // Force DONE if criteria met
      if (
        check.actual.comments24h >= check.actual.commentsRequired &&
        check.actual.postDone === true
      ) {
        check.status = "done";
      }
      check.verifiedAt = new Date();
      await check.save();
    } catch (err) {
      console.error("Unexpected verify error:", err.message);
    }
  }

  return { total: checks.length, manual };
}

module.exports = { verifyRedditCTR };
