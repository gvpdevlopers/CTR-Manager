const BHWAccount = require("../models/BhwAccount");
const BHWCTRCheck = require("../models/BhwCTRCheck");
const { fetchBHWProfile } = require("../services/bhwService");

/* ===== DATE HELPERS ===== */

function formatDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/* ======================= */

async function runBHWCTRCheck(req, res) {
  console.log("🟡 API HIT: runBHWCTRCheck");

  try {
    const { bhwAccountId } = req.params;
    console.log("▶ Account ID:", bhwAccountId);

    const acc = await BHWAccount.findById(bhwAccountId);
    if (!acc) {
      console.log("❌ Account not found");
      return res.status(404).json({ error: "Account not found" });
    }

    console.log("▶ Account found:", acc.name);
    console.log("▶ Stored slug:", acc.bhwSlug);

    if (!acc.bhwSlug) {
      console.log("❌ bhwSlug missing in DB");
      return res.status(400).json({ error: "BHW slug missing" });
    }

    console.log("🚀 Calling Selenium scraper...");

    const profile = await Promise.race([
      fetchBHWProfile(acc.bhwSlug),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("BHW fetch timeout")), 180000),
      ),
    ]);

    console.log("✅ Selenium returned:", profile);

    const today = formatDate(new Date());
    const yesterday = formatDate(subtractDays(new Date(), 1));

    const prev = await BHWCTRCheck.findOne({
      bhwAccountId: acc._id,
      date: yesterday,
    });

    console.log("▶ Previous record:", prev ? "FOUND" : "NONE");

    const deltaMessages = prev ? profile.messages - prev.snapshot.messages : 0;
    const deltaReaction = prev
      ? profile.reactionScore - prev.snapshot.reactionScore
      : 0;
    const deltaThreads = prev
      ? profile.threadsStarted - prev.snapshot.threadsStarted
      : 0;

    console.log("▶ Delta:", {
      deltaMessages,
      deltaReaction,
      deltaThreads,
    });

    let status = "not_done";
    if (deltaMessages > 0 || deltaReaction > 0 || deltaThreads > 0) {
      status = "partial";
    }
    if (deltaMessages > 0 && deltaReaction > 0) {
      status = "done";
    }

    const record = await BHWCTRCheck.findOneAndUpdate(
      { bhwAccountId: acc._id, date: today },
      {
        bhwAccountId: acc._id,
        username: acc.bhwSlug,
        date: today,
        snapshot: profile,
        delta: {
          messages: deltaMessages,
          reactionScore: deltaReaction,
          threadsStarted: deltaThreads,
        },
        status,
        meta: {
          fetchedAt: new Date(),
          source: "selenium-local",
        },
      },
      { upsert: true, new: true },
    );

    acc.lastCheckedAt = new Date();
    await acc.save();

    console.log("🟢 CTR check completed");

    res.json({ success: true, data: record });
  } catch (err) {
    console.error("❌ runBHWCTRCheck error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getBHWCTRStatus(req, res) {
  try {
    const today = formatDate(new Date());
    const data = await BHWCTRCheck.find({ date: today }).populate(
      "bhwAccountId",
      "userId name link",
    );
    res.json(data);
  } catch (err) {
    console.error("❌ getBHWCTRStatus error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getBHWCTRHistory(req, res) {
  try {
    const { bhwAccountId } = req.params;
    const history = await BHWCTRCheck.find({ bhwAccountId })
      .sort({ date: -1 })
      .limit(30);
    res.json(history);
  } catch (err) {
    console.error("❌ getBHWCTRHistory error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  runBHWCTRCheck,
  getBHWCTRStatus,
  getBHWCTRHistory,
};
