const axios = require("axios");

const WORKER_BASE = "http://localhost:5051";

async function checkBHWWorkerHealth() {
  try {
    const res = await axios.get(`${WORKER_BASE}/health`, {
      timeout: 5000,
    });

    return res.data;
  } catch (err) {
    return {
      status: "down",
      reason: "worker_unreachable",
      error: err.message,
    };
  }
}

module.exports = { checkBHWWorkerHealth };
