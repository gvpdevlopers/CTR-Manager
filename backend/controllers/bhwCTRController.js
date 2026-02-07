const BHWAccount = require("../models/BhwAccount");
const BHWCTRCheck = require("../models/BhwCTRCheck");
const TaskExecution = require("../models/TaskExecution");
const User = require("../models/User");
const { fetchBHWProfile } = require("../services/bhwService");
const { checkBHWWorkerHealth } = require("../services/bhwWorkerHealth");

/* ===== CONFIG ===== */
const RETRY_COOLDOWN_MINUTES = 1;
const RETRY_COOLDOWN_MS = RETRY_COOLDOWN_MINUTES * 60 * 1000;
const REQUIRED_MESSAGES = 2;


/* ===== DATE HELPERS ===== */
function formatDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function subtractDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/* =======================
   RUN CTR CHECK
======================= */

async function runBHWCTRCheck(req, res) {
  try {
    const { bhwAccountId } = req.params;
    const now = new Date();

    const today = formatDate(now);
    const yesterday = formatDate(subtractDays(now, 1));

    const acc = await BHWAccount.findById(bhwAccountId);
    if (!acc) return res.status(404).json({ error: "Account not found" });
    if (!acc.bhwSlug)
      return res.status(400).json({ error: "BHW slug missing" });

    /* =========================
       WORKER HEALTH CHECK
    ========================= */
    const health = await checkBHWWorkerHealth();
    if (health.status !== "healthy") {
      return res.status(503).json({
        error: "BHW worker unavailable",
        details: health.reason || "unknown",
      });
    }

    /* =========================
       FETCH TODAY RECORD (IF ANY)
    ========================= */
    let todayRecord = await BHWCTRCheck.findOne({
      bhwAccountId: acc._id,
      date: today,
    });

    /* =========================
       COOLDOWN CHECK
    ========================= */
    if (todayRecord?.lastRetryAt) {
      const diff = now - new Date(todayRecord.lastRetryAt);
      if (diff < RETRY_COOLDOWN_MS) {
      return res.status(200).json({
  success: true,
  cooldown: true,
  retryAfterSeconds: Math.ceil((RETRY_COOLDOWN_MS - diff) / 1000),
});

      }
    }

    /* =========================
       CHECK EMPLOYEE CTR CLAIM
    ========================= */
    const exec = await TaskExecution.findOne({
      accountId: acc._id,
      platform: "bhw",
      taskId: "daily_ctr",
      taskDate: {
        $gte: new Date(`${today}T00:00:00.000Z`),
        $lte: new Date(`${today}T23:59:59.999Z`),
      },
    }).lean();

    const hasEmployeeCTR = !!exec;

    /* =========================
       HARD GATE: CTR NOT MARKED
    ========================= */
    if (!hasEmployeeCTR) {
  const record = await BHWCTRCheck.findOneAndUpdate(
    { bhwAccountId: acc._id, date: today },
    {
      bhwAccountId: acc._id,
      username: acc.bhwSlug,
      date: today,
      snapshot: todayRecord?.snapshot || null,
      delta: { messages: 0, reactionScore: 0, threadsStarted: 0 },
      status: "not_done",
      retryCount: todayRecord?.retryCount || 0,
      lastRetryAt: todayRecord?.lastRetryAt || null,
      meta: {
        fetchedAt: todayRecord?.meta?.fetchedAt || new Date(),
        source: "selenium-local",
        error: "CTR not marked today",
        baselineSnapshot: todayRecord?.meta?.baselineSnapshot || null,
      },
    },
    { upsert: true, new: true }
  );

  return res.status(200).json({
    success: true,
    data: record,
    skipped: true,
  });
}


    /* =========================
       FETCH PROFILE (SELENIUM)
    ========================= */
    const profile = await Promise.race([
      fetchBHWProfile(acc.bhwSlug),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("BHW fetch timeout")), 180000)
      ),
    ]);

    /* =========================
       ENSURE TODAY RECORD EXISTS
    ========================= */
    if (!todayRecord) {
      todayRecord = await BHWCTRCheck.create({
        bhwAccountId: acc._id,
        username: acc.bhwSlug,
        date: today,
        snapshot: profile,
        delta: { messages: 0, reactionScore: 0, threadsStarted: 0 },
        status: "pending",
        retryCount: 0,
        lastRetryAt: null,
        meta: {
          fetchedAt: new Date(),
          source: "selenium-local",
          error: null,
          baselineSnapshot: profile,
        },
      });
    }

    /* =========================
       BASELINE SNAPSHOT
    ========================= */
    let baselineSnapshot = todayRecord.meta?.baselineSnapshot;

    if (!baselineSnapshot) {
      const yesterdayRecord = await BHWCTRCheck.findOne({
        bhwAccountId: acc._id,
        date: yesterday,
        status: { $ne: "done_manual" },
      });

      baselineSnapshot = yesterdayRecord?.snapshot || profile;
    }

    /* =========================
       DELTA CALCULATION
    ========================= */
    const deltaMessages = profile.messages - (baselineSnapshot.messages || 0);
    const deltaReaction =
      profile.reactionScore - (baselineSnapshot.reactionScore || 0);
    const deltaThreads =
      profile.threadsStarted - (baselineSnapshot.threadsStarted || 0);

    /* =========================
       CTR TIME ENFORCEMENT
    ========================= */
    const seleniumRanBeforeCTR =
      exec?.markedDoneAt &&
      todayRecord.meta?.fetchedAt &&
      new Date(todayRecord.meta.fetchedAt) < new Date(exec.markedDoneAt);

    /* =========================
       FINAL STATUS
    ========================= */
  let status = "not_done";

  if (!hasEmployeeCTR) {
  status = "not_done";
}
else if (seleniumRanBeforeCTR) {
  status = "pending";
}
else if (deltaMessages >= REQUIRED_MESSAGES) {
  status = "done";
}
else if (deltaMessages > 0) {
  status = "partial";
}
else {
  status = "not_done";
}


    const shouldCountRetry = !seleniumRanBeforeCTR;

    /* =========================
       FINAL UPSERT
    ========================= */
    const record = await BHWCTRCheck.findOneAndUpdate(
      { bhwAccountId: acc._id, date: today },
      {
        snapshot: {
  messages: profile.messages,
  reactionScore: profile.reactionScore,
  threadsStarted: profile.threadsStarted,
},
        delta: {
          messages: deltaMessages,
          reactionScore: deltaReaction,
          threadsStarted: deltaThreads > 0 ? 1 : 0,
        },
        status,
        retryCount: shouldCountRetry
          ? todayRecord.retryCount + 1
          : todayRecord.retryCount,
        lastRetryAt: shouldCountRetry ? now : todayRecord.lastRetryAt,
        meta: {
          fetchedAt: todayRecord.meta.fetchedAt,
          source: "selenium-local",
          error: null,
          baselineSnapshot,
        },
      },
      { new: true }
    );

    acc.lastCheckedAt = new Date();
    await acc.save();

    res.json({ success: true, data: record });
  } catch (err) {
    console.error("❌ runBHWCTRCheck error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/* =======================
   STATUS + HISTORY
======================= */

async function getBHWCTRStatus(req, res) {
  try {
    const today = formatDate(new Date());
    const data = await BHWCTRCheck.find({ date: today });
    res.json(data);
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
}

/* =======================
   ADMIN DASHBOARD (FIXED)
======================= */

async function getBHWCTRDahboard(req, res) {
  try {
    const now = new Date();
    const today = formatDate(now);

    const accounts = await BHWAccount.find({}).select("bhwSlug").lean();

    const checks = await BHWCTRCheck.find({ date: today }).lean();

    const executions = await TaskExecution.find({
      platform: "bhw",
      taskDate: {
        $gte: new Date(today),
        $lte: new Date(today + "T23:59:59"),
      },
    })
      .populate("employeeId", "fullName")
      .lean();

    const checkMap = {};
    checks.forEach((c) => {
      checkMap[c.bhwAccountId.toString()] = c;
    });

    const execMap = {};
    executions.forEach((e) => {
      execMap[e.accountId.toString()] = e;
    });

    const rows = accounts.map((acc) => {
      const check = checkMap[acc._id.toString()];
      const exec = execMap[acc._id.toString()];

      const hasEmployeeCTR = !!exec;

      /* =========================
         STATUS DECISION (CORRECT)
      ========================= */
  let status = "not_visible";

if (!hasEmployeeCTR) {
  status = "not_visible";
} else if (hasEmployeeCTR && !check) {
  status = "pending"; // CTR marked, selenium not run
} else {
  if (check.status === "done") status = "done";
  else if (check.status === "partial") status = "partial";
  else status = "not_done";
}



      /* =========================
         COOLDOWN + RETRY LOCK
      ========================= */
      let cooldownRemainingSeconds = 0;
      if (check?.lastRetryAt) {
        const diff = now - new Date(check.lastRetryAt);
        if (diff < RETRY_COOLDOWN_MS) {
          cooldownRemainingSeconds = Math.ceil(
            (RETRY_COOLDOWN_MS - diff) / 1000,
          );
        }
      }

      const hasSeleniumRun = !!check;

const canRetry =
  hasEmployeeCTR &&           // CTR must be marked
  hasSeleniumRun &&           // Selenium must have run once
  !["done", "done_manual", "pending"].includes(status) &&
  cooldownRemainingSeconds === 0;

      return {
  _id: acc._id,
  bhwAccountId: acc._id,
  username: acc.bhwSlug,

  status,

  snapshot: check?.snapshot || null,
  delta: check?.delta || null,

  retryCount: check?.retryCount || 0,
  lastRetryAt: check?.lastRetryAt || null,
  cooldownRemainingSeconds,
  canRetry, //  REQUIRED

  ctrDoneBy: exec?.employeeId?.fullName || null,
  ctrDoneAt: exec?.markedDoneAt || null,
};

    });

    const summary = {
      total: rows.length,
      done: rows.filter((r) => r.status === "done").length,
      suspicious: rows.filter((r) => r.status === "suspicious").length,
      not_done: rows.filter((r) => r.status === "not_done").length,
      pending: rows.filter((r) => r.status === "pending").length,
    };

    res.json({ summary, rows });
  } catch (err) {
    console.error("❌ getBHWCTRDahboard error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  runBHWCTRCheck,
  getBHWCTRStatus,
  getBHWCTRHistory,
  getBHWCTRDahboard,
};
