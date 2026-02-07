const BHWAccount = require("../models/BhwAccount");
const BHWCTRCheck = require("../models/BhwCTRCheck");

/* ===== DATE ===== */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================
   ADMIN BHW DASHBOARD
============================ */

async function getAdminBhwDashboard(req, res) {
  try {
    const today = todayStr();

    /* 1️⃣ Get all BHW accounts */
    const accounts = await BHWAccount.find().lean();

    /* 2️⃣ Get today's CTR checks */
    const checks = await BHWCTRCheck.find({ date: today }).lean();

    const checkMap = new Map();
    checks.forEach((c) => {
      checkMap.set(String(c.bhwAccountId), c);
    });

    let summary = {
      total: accounts.length,
      done: 0,
      partial: 0,
      failed: 0,
      pending: 0,
    };

    const rows = accounts.map((acc) => {
      const check = checkMap.get(String(acc._id));

      let status = "pending";
      let error = null;

     if (!check) {
  status = "pending";
} else if (check.status === "done") {
  status = "done";
} else if (check.status === "partial") {
  status = "partial";
} else {
  status = "failed";
}


      summary[status]++;

      return {
        _id: check?._id || acc._id,
        bhwAccountId: acc._id,
        username: acc.bhwSlug,
        status,
        snapshot: check?.snapshot || null,
        delta: check?.delta || null,
        meta: check?.meta || null,
        error,
      };
    });

    res.json({ rows, summary });
  } catch (err) {
    console.error("❌ Admin BHW dashboard error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAdminBhwDashboard };
