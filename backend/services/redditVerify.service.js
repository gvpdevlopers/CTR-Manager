const RedditCTRCheck = require("../models/RedditCTRCheck");
const axios = require("axios");

const COMMENT_REQUIRED_24H = 2;
const POST_VALID_DAYS = 5;
const MS_24_HOURS = 24 * 60 * 60 * 1000;

const isWithinLast24Hours = (utc) => Date.now() - utc * 1000 <= MS_24_HOURS;

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function verifyRedditCTR(ctrCheckId = null, { manual = false } = {}) {
  console.log("⚠️ Reddit verification temporarily disabled");
  return { total: 0, manual };
}

//  async function verifyRedditCTR(ctrCheckId = null, { manual = false } = {}) {
//   const today = new Date().toISOString().split("T")[0];

//   const checks = ctrCheckId
//     ? await RedditCTRCheck.find({ _id: ctrCheckId })
//     : await RedditCTRCheck.find({ date: today });

//   for (const check of checks) {
//     let totalComments24h = 0;
//     let postValidTill = check.actual?.postValidTill || null;

//     const breakdown = {
//       user1: { comments24h: 0, posts24h: 0 },
//       user2: { comments24h: 0, posts24h: 0 },
//     };

//     try {
//       const users = [
//         { name: check.username1, key: "user1" },
//         { name: check.username2, key: "user2" },
//       ].filter((u) => u.name);

//       for (const u of users) {
//         /* COMMENTS */
//         const commentsRes = await axios.get(
//           `https://www.reddit.com/user/${u.name}/comments.json?limit=50&sort=new&t=day
// `,
//           { headers: { "User-Agent": "CTR-Monitor/1.0" } }
//         );

//         const recentComments = commentsRes.data.data.children.filter((c) =>
//           isWithinLast24Hours(c.data.created_utc)
//         );

//         breakdown[u.key].comments24h = recentComments.length;
//         totalComments24h += recentComments.length;

//         /* POSTS */
//         if (!postValidTill || new Date(postValidTill) < new Date()) {
//           const postsRes = await axios.get(
//             `https://www.reddit.com/user/${u.name}/submitted.json?limit=20&sort=new&t=week`,
//             {
//               headers: {
//                 "User-Agent": "CTR-Monitor/1.0 (by u/your_reddit_username)",
//               },
//             }
//           );

//           const hasRecentPost = postsRes.data.data.children.some(
//             (p) =>
//               Date.now() - p.data.created_utc * 1000 <=
//               POST_VALID_DAYS * MS_24_HOURS
//           );

//           breakdown[u.key].posts24h = postsRes.data.data.children.length;

//           if (hasRecentPost) {
//             postValidTill = daysFromNow(POST_VALID_DAYS);
//           }
//         }
//       }

//       console.log("VERIFYING CTR:", check._id, {
//         totalComments24h,
//         postValidTill,
//         breakdown,
//       });

//       /* SAVE */
//       check.actual = {
//         breakdown: {
//           user1: {
//             comments24h: breakdown.user1.comments24h ?? 0,
//             posts24h: breakdown.user1.posts24h ?? 0,
//           },
//           user2: {
//             comments24h: breakdown.user2.comments24h ?? 0,
//             posts24h: breakdown.user2.posts24h ?? 0,
//           },
//         },

//         comments24h: totalComments24h ?? 0,
//         commentsRequired: COMMENT_REQUIRED_24H,
//         postDone: Boolean(postValidTill),
//         postValidTill: postValidTill || null,
//       };

//       /* STATUS */
//       if (totalComments24h >= COMMENT_REQUIRED_24H && postValidTill) {
//         check.status = "done";
//       } else if (totalComments24h > 0 || postValidTill) {
//         check.status = "suspicious";
//       } else {
//         check.status = "not_done";
//       }

//       await check.save();
//     } catch (err) {
//       check.status =
//         check.actual?.comments24h > 0 || check.actual?.postValidTill
//           ? "suspicious"
//           : "not_done";

//       check.actual = {
//         breakdown: {
//           user1: {
//             comments24h: check.actual?.breakdown?.user1?.comments24h ?? 0,
//             posts24h: check.actual?.breakdown?.user1?.posts24h ?? 0,
//           },
//           user2: {
//             comments24h: check.actual?.breakdown?.user2?.comments24h ?? 0,
//             posts24h: check.actual?.breakdown?.user2?.posts24h ?? 0,
//           },
//         },
//         comments24h: check.actual?.comments24h ?? 0,
//         commentsRequired: COMMENT_REQUIRED_24H,
//         postDone: Boolean(check.actual?.postValidTill),
//         postValidTill: check.actual?.postValidTill ?? null,
//       };

//       await check.save();
//     }
//   }

//   return { total: checks.length, manual };
// }

module.exports = { verifyRedditCTR };
