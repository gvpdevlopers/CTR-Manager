// const { getTodayRangeUTC } = require("../utils/date");

// exports.countTodayActivity = (items) => {
//   const { start, end } = getTodayRangeUTC();

//   let comments = 0;
//   let posts = 0;

//   for (const item of items) {
//     const data = item.data;
//     const created = new Date(data.created_utc * 1000);

//     if (created < start || created > end) continue;

//     if (item.kind === "t1") comments++;
//     if (item.kind === "t3") posts++;
//   }

//   return { comments, posts };
// };
