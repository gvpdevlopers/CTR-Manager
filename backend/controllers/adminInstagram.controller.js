const { businessDate } = require("../utils/businessDate");
const { startRun, getRun } = require("../services/verificationRun.service");
const TaskExecution = require("../models/TaskExecution");
const { claimDateRange } = require("../utils/businessDate");
const InstagramAccount = require("../models/InstagramAccount");
const InstagramCTRCheck = require("../models/InstagramCTRCheck");
const { runInstagramCTRVerification } = require("../cron/instagramCTR.cron");

function getTodayDate() {
  return businessDate();
}

exports.verifyInstagramNow = async (req, res) => {
  if (!(await startRun("instagram", () => runInstagramCTRVerification({ manual: true })))) {
    return res.status(409).json({ message: "Instagram verification is already running." });
  }
  return res.status(202).json({ message: "Instagram verification started." });
};

exports.getInstagramVerificationStatus = async (req, res) => res.json(await getRun("instagram"));

exports.getAdminInstagramDashboard = async (req, res) => {
  try {
    const today = businessDate();

    const ctrChecks = await InstagramCTRCheck.find({ date: today })
      .populate("employeeId", "fullName username email")
      .populate("instagramAccountId", "username")
      .sort({ createdAt: -1 });

    const { start, end } = claimDateRange(today);
    const claims = await TaskExecution.find({ platform: "instagram", taskId: "daily_ctr", taskDate: { $gte: start, $lt: end } }).populate("employeeId", "fullName username").populate("accountId", "username").sort({ markedDoneAt: 1 }).lean();
    const claimByAccount = new Map();
    for (const claim of claims) if (claim.accountId && !claimByAccount.has(String(claim.accountId._id))) claimByAccount.set(String(claim.accountId._id), claim);
    const rows = ctrChecks.map((ctr, index) => ({
      accountId: String(ctr.instagramAccountId?._id || ctr.instagramAccountId || ""),
      markedAt: claimByAccount.get(String(ctr.instagramAccountId?._id || ctr.instagramAccountId))?.markedDoneAt || ctr.employeeSubmittedAt || null,
      sr: index + 1,
      username: ctr.instagramAccountId?.username || ctr.username,
      status: ctr.status,

      following: ctr?.status === "unavailable" ? null : (ctr?.deltas?.following ?? 0),
      posts: ctr?.status === "unavailable" ? null : (ctr?.deltas?.posts ?? 0),

      ctrDoneBy:
        ctr?.employeeId?.fullName ||
        ctr?.employeeId?.username ||
        ctr?.employeeId?.email ||
        "—",

      verifiedAt: ctr.verifiedAt || null,
      failureReasons: ctr.failureReasons || [],
    }));

    const checkedIds = new Set(rows.map((row) => row.accountId));
    for (const [accountId, claim] of claimByAccount) if (!checkedIds.has(accountId)) rows.push({ accountId, username: claim.accountId.username, status: "pending", following: null, posts: null, ctrDoneBy: claim.employeeId?.fullName || claim.employeeId?.username || "?", markedAt: claim.markedDoneAt, verifiedAt: null, failureReasons: ["Awaiting verification"] });
    const summary = {
      total: rows.length,
      pending: rows.filter(r => r.status === "pending").length,
      unavailable: rows.filter(r => r.status === "unavailable").length,
      done: rows.filter(r => r.status === "done").length,
      suspicious: rows.filter(r => r.status === "suspicious").length,
      not_done: rows.filter(r => r.status === "not_done").length,
    };

    return res.json({ summary, rows });
  } catch (err) {
    console.error("Instagram Admin Dashboard Error:", err);
    res.status(500).json({ message: "Failed to load Instagram dashboard" });
  }
};


// exports.getAdminInstagramDashboard = async (req, res) => {
//   try {
//     const today = getTodayDate();

//     /* =========================
//        1️⃣ FETCH ACCOUNTS
//     ========================= */
//     const accounts = await InstagramAccount.find({})
//       .populate("ownedBy", "name email")
//       .lean();

//     /* =========================
//        2️⃣ FETCH TODAY CTR
//     ========================= */
//     const ctrChecks = await InstagramCTRCheck.find({ date: today })
//       .populate("employeeId", "fullName username email")
//       .exec();

//     console.log(
//       "CTR DEBUG:",
//       ctrChecks.map((c) => ({
//         id: c._id,
//         employeeId: c.employeeId,
//         type: typeof c.employeeId,
//       }))
//     );

//     const ctrMap = {};
//     ctrChecks.forEach((ctr) => {
//       if (ctr.instagramAccountId) {
//         ctrMap[ctr.instagramAccountId.toString()] = ctr;
//       }
//     });

//     /* =========================
//        3️⃣ SUMMARY (CTR BASED)
//     ========================= */
//     const summary = {
//       total: accounts.length,
//       done: 0,
//       suspicious: 0,
//       not_done: 0,
//     };

//     /* =========================
//        4️⃣ ROWS
//     ========================= */
//     const rows = accounts.map((acc, index) => {
//       const ctr = ctrMap[acc._id.toString()];

//       const status = ctr?.status || "not_done";

//       if (status === "done") summary.done++;
//       else if (status === "suspicious") summary.suspicious++;
//       else summary.not_done++;

//       return {
//         sr: index + 1,
//         username: acc.username,

//         // RAW CTR STATUS
//         status,

//         // Snapshot data
//         // following: ctr?.snapshot?.following ?? 0,
//         following: ctr?.deltas?.following ?? 0,
//         posts: ctr?.deltas?.posts ?? 0,

//         // Who submitted CTR
//         ctrDoneBy:
//           ctr?.employeeId?.fullName ||
//           ctr?.employeeId?.username ||
//           ctr?.employeeId?.email ||
//           "—",

//         // Verification time
//         verifiedAt: ctr?.verifiedAt || null,

//         // For tooltip (UI already supports this)
//         failureReasons: ctr?.failureReasons || [],
//       };
//     });

//     return res.status(200).json({
//       summary,
//       rows,
//     });
//   } catch (err) {
//     console.error("Instagram Admin Dashboard Error:", err);
//     return res
//       .status(500)
//       .json({ message: "Failed to load Instagram dashboard" });
//   }
// };
