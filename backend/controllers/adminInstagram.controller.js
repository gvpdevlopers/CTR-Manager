const InstagramAccount = require("../models/InstagramAccount");
const InstagramCTRCheck = require("../models/InstagramCTRCheck");
const { runInstagramCTRVerification } = require("../cron/instagramCTR.cron");

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

exports.verifyInstagramNow = async (req, res) => {
  try {
    // Start verification but DO NOT await it
    runInstagramCTRVerification({ manual: true })
      .then(result => {
        console.log("Manual verification finished:", result);
      })
      .catch(err => {
        console.error("Manual verification error:", err);
      });

    return res.status(200).json({
      success: true,
      message: "Verification started. Please refresh after a few seconds.",
    });

  } catch (err) {
    console.error("Manual Instagram verify error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to start verification",
    });
  }
};




exports.getAdminInstagramDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const ctrChecks = await InstagramCTRCheck.find({ date: today })
      .populate("employeeId", "fullName username email")
      .populate("instagramAccountId", "username")
      .sort({ createdAt: -1 });

    const rows = ctrChecks.map((ctr, index) => ({
      sr: index + 1,
      username: ctr.instagramAccountId?.username || ctr.username,
      status: ctr.status,

      following: ctr?.deltas?.following ?? 0,
      posts: ctr?.deltas?.posts ?? 0,

      ctrDoneBy:
        ctr?.employeeId?.fullName ||
        ctr?.employeeId?.username ||
        ctr?.employeeId?.email ||
        "—",

      verifiedAt: ctr.verifiedAt || null,
      failureReasons: ctr.failureReasons || [],
    }));

    const summary = {
      total: rows.length,
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
