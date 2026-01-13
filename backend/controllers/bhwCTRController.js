const BHWAccount = require("../models/BhwAccount");
const BHWCTRCheck = require("../models/BhwCTRCheck");
const { fetchBHWProfile } = require("../services/bhwService");

/* ===== DATE HELPERS (add this) ===== */

function formatDate(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/* ================================== */

async function runBHWCTRCheck(req, res) {
  try {
    const { bhwAccountId } = req.params;
    const acc = await BHWAccount.findById(bhwAccountId);

    if (!acc) return res.status(404).json({ error: "Account not found" });

    const today = formatDate(new Date());
    const yesterday = formatDate(subtractDays(new Date(), 1));

    const profile = await fetchBHWProfile(acc.usernameSlug);

    const prev = await BHWCTRCheck.findOne({
      bhwAccountId: acc._id,
      date: yesterday,
    });

    const deltaMessages = prev ? profile.messages - prev.snapshot.messages : 0;
    const deltaReaction = prev
      ? profile.reactionScore - prev.snapshot.reactionScore
      : 0;

    let status = "not_done";
    if (deltaMessages > 0 && deltaReaction > 0) status = "done";
    else if (deltaMessages > 0 || deltaReaction > 0) status = "partial";

    const record = await BHWCTRCheck.findOneAndUpdate(
      { bhwAccountId: acc._id, date: today },
      {
        bhwAccountId: acc._id,
        username: acc.usernameSlug,
        date: today,
        snapshot: {
          messages: profile.messages,
          reactionScore: profile.reactionScore,
          lastSeen: profile.lastSeen,
        },
        delta: {
          messages: deltaMessages,
          reactionScore: deltaReaction,
        },
        status,
        meta: {
          fetchedAt: new Date(),
          source: "manual",
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: record });
  } catch (err) {
    console.error("runBHWCTRCheck error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getBHWCTRStatus(req, res) {
  try {
    const today = formatDate(new Date());

    const data = await BHWCTRCheck.find({ date: today }).populate(
      "bhwAccountId",
      "usernameSlug"
    );

    res.json(data);
  } catch (err) {
    console.error("getBHWCTRStatus error:", err);
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
    console.error("getBHWCTRHistory error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  runBHWCTRCheck,
  getBHWCTRStatus,
  getBHWCTRHistory,
};
