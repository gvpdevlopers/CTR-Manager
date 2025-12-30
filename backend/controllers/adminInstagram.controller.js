const InstagramAccount = require("../models/InstagramAccount");
const InstagramCTRCheck = require("../models/InstagramCTRCheck");

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

exports.getAdminInstagramDashboard = async (req, res) => {
  try {
    const today = getTodayDate();

    /* =========================
       1️⃣ FETCH ACCOUNTS
    ========================= */
    const accounts = await InstagramAccount.find({})
      .populate("ownedBy", "name email")
      .lean();

    /* =========================
       2️⃣ FETCH TODAY CTR
    ========================= */
    const ctrChecks = await InstagramCTRCheck.find({ date: today })
      .populate("employeeId", "fullName username email")
      .exec();

    console.log(
      "CTR DEBUG:",
      ctrChecks.map((c) => ({
        id: c._id,
        employeeId: c.employeeId,
        type: typeof c.employeeId,
      }))
    );

    const ctrMap = {};
    ctrChecks.forEach((ctr) => {
      if (ctr.instagramAccountId) {
        ctrMap[ctr.instagramAccountId.toString()] = ctr;
      }
    });

    /* =========================
       3️⃣ SUMMARY (CTR BASED)
    ========================= */
    const summary = {
      total: accounts.length,
      done: 0,
      suspicious: 0,
      not_done: 0,
    };

    /* =========================
       4️⃣ ROWS
    ========================= */
    const rows = accounts.map((acc, index) => {
      const ctr = ctrMap[acc._id.toString()];

      const status = ctr?.status || "not_done";

      if (status === "done") summary.done++;
      else if (status === "suspicious") summary.suspicious++;
      else summary.not_done++;

      return {
        sr: index + 1,
        username: acc.username,

        // RAW CTR STATUS
        status,

        // Snapshot data
        // following: ctr?.snapshot?.following ?? 0,
        following: ctr?.deltas?.following ?? 0,
        posts: ctr?.deltas?.posts ?? 0,

        // Who submitted CTR
        ctrDoneBy:
          ctr?.employeeId?.fullName ||
          ctr?.employeeId?.username ||
          ctr?.employeeId?.email ||
          "—",

        // Verification time
        verifiedAt: ctr?.verifiedAt || null,

        // For tooltip (UI already supports this)
        failureReasons: ctr?.failureReasons || [],
      };
    });

    return res.status(200).json({
      summary,
      rows,
    });
  } catch (err) {
    console.error("Instagram Admin Dashboard Error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load Instagram dashboard" });
  }
};
