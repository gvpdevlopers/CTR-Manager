// selenium/bhw.worker.js
const express = require("express");
const { createDriver } = require("./bhw.driver");
const { fetchBHWProfile } = require("./bhw.scraper");

const app = express();

(async () => {
  await createDriver();
  console.log("⚠️ Solve Cloudflare ONCE in the opened browser");
})();

app.get("/fetch/:slug", async (req, res) => {
  const { slug } = req.params;
  console.log("🧪 Worker fetching:", slug);

  try {
    const data = await fetchBHWProfile(slug);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let lastHealth = {
  status: "starting",
  lastCheckedAt: null,
  browser: {
    running: false,
    session: "unknown",
  },
  reason: null,
};

app.get("/health", async (req, res) => {
  try {
    lastHealth = {
      status: "healthy",
      lastCheckedAt: new Date(),
      browser: {
        running: true,
        session: "alive",
      },
      reason: null,
    };

    res.json(lastHealth);
  } catch (err) {
    lastHealth = {
      status: "blocked",
      lastCheckedAt: new Date(),
      browser: {
        running: false,
        session: "lost",
      },
      reason: "browser_crash",
    };

    res.status(503).json(lastHealth);
  }
});


app.listen(5051, () =>
  console.log("🟢 Selenium Worker listening on http://localhost:5051")
);
