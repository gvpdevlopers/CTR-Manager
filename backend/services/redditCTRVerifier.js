// const RedditCTRCheck = require("../models/RedditCTRCheck");
// const { fetchUserJSON } = require("./redditFetcher");
// const { countTodayActivity } = require("./redditCounter");
// const { evaluateStatus } = require("./redditStatusEvaluator");

// exports.verifyRedditCTR = async (ctrCheckId) => {
//   const ctrCheck = await RedditCTRCheck.findById(ctrCheckId);
//   if (!ctrCheck) return;

//   const [u1Items, u2Items] = await Promise.all([
//     fetchUserJSON(ctrCheck.username1),
//     fetchUserJSON(ctrCheck.username2),
//   ]);

//   const u1Counts = countTodayActivity(u1Items);
//   const u2Counts = countTodayActivity(u2Items);

//   const status = evaluateStatus({
//     u1: u1Counts,
//     u2: u2Counts,
//   });

//   ctrCheck.actual = {
//     user1Comments: u1Counts.comments,
//     user1Posts: u1Counts.posts,
//     user2Comments: u2Counts.comments,
//     user2Posts: u2Counts.posts,
//   };

//   ctrCheck.status = status;
//   await ctrCheck.save();

//   return ctrCheck;
// };
