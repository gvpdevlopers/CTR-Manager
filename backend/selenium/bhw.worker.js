const express = require("express");
const { fetchBHWProfile } = require("./bhw.scraper");

const app = express();

console.log("🟢 Selenium BHW Worker started");
console.log("⚠️ Solve Cloudflare ONCE when browser opens");

app.get("/fetch/:slug", async (req, res) => {
  const { slug } = req.params;

  console.log("🧪 Worker fetching:", slug);

  try {
    const data = await fetchBHWProfile(slug);
    console.log("✅ Worker result:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Worker error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5051, () =>
  console.log("🟢 Selenium Worker listening on http://localhost:5051"),
);
