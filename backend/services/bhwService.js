// services/bhwService.js
const axios = require("axios");

const WORKER_BASE = "http://localhost:5051";
const MAX_ATTEMPTS = 2;

/* ================= HELPERS ================= */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(errMsg = "") {
  const msg = errMsg.toLowerCase();

  const retryable = [
    "stale element",
    "wait timed out",
    "no such element",
    "element not interactable",
  ];

  const fatal = [
    "cloudflare",
    "browser_crash",
    "session lost",
    "worker_unreachable",
  ];

  if (fatal.some((k) => msg.includes(k))) return false;
  if (retryable.some((k) => msg.includes(k))) return true;

  return false;
}

async function checkWorkerHealth() {
  try {
    const res = await axios.get(`${WORKER_BASE}/health`, {
      timeout: 5000,
    });

    return res.data?.status === "healthy";
  } catch (err) {
    return false;
  }
}

/* ================= CORE ================= */

async function fetchBHWProfile(slug) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`🔁 BHW fetch attempt ${attempt}/${MAX_ATTEMPTS}:`, slug);

    const healthy = await checkWorkerHealth();
    if (!healthy) {
      throw new Error("worker_unreachable");
    }

    try {
      const res = await axios.get(
        `${WORKER_BASE}/fetch/${slug}`,
        { timeout: 300000 } // 5 minutes
      );

      console.log("✅ Worker response received");
      return res.data;
    } catch (err) {
      const errMsg =
        err?.response?.data?.error ||
        err?.message ||
        "unknown_error";

      console.error(`❌ Attempt ${attempt} failed:`, errMsg);
      lastError = errMsg;

      if (!isRetryableError(errMsg)) {
        throw new Error(errMsg);
      }

      if (attempt < MAX_ATTEMPTS) {
        console.log("⏳ Retrying after delay...");
        await sleep(7000);
      }
    }
  }

  throw new Error(lastError || "retry_exhausted");
}

module.exports = { fetchBHWProfile };
