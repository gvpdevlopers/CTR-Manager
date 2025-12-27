require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// ===== Routes =====
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const platformAccountRoutes = require("./routes/platformAccountRoutes");
const platformTaskRoutes = require("./routes/platformTaskRoutes");

const instagramAccountRoutes = require("./routes/instagramAccountRoutes");
const redditAccountRoutes = require("./routes/redditAccountRoutes");
const quoraAccountRoutes = require("./routes/quoraAccountRoutes");
const bhwAccountRoutes = require("./routes/bhwAccountRoutes");

const keywordRoutes = require("./routes/keywordRoutes");
const taskExecutionRoutes = require("./routes/taskExecutionRoutes");
const ctrRoutes = require("./routes/ctr.routes");

// Admin feature routes
const adminRedditRoutes = require("./routes/admin.reddit.routes");
const adminInstagramRoutes = require("./routes/adminInstagram.routes");
const adminQuoraDashboardRoutes = require("./routes/admin.quora.dashboard");

// Platform feature routes
const redditRoutes = require("./routes/reddit.routes");

// ===== Cron Jobs =====
const { startRedditCTRCron } = require("./cron/redditCTR.cron");
const { startInstagramCTRCron } = require("./cron/instagramCTR.cron");

const app = express();

// ===== Database =====
connectDB();

// ===== Middlewares =====
app.use(cors());
app.use(express.json());

// ===== Routes Registration =====

// Auth & Admin
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Platform Accounts
app.use("/api/platform-accounts", platformAccountRoutes);
app.use("/api/platform-tasks", platformTaskRoutes);

app.use("/api/instagram-accounts", instagramAccountRoutes);
app.use("/api/reddit-accounts", redditAccountRoutes);
app.use("/api/quora-accounts", quoraAccountRoutes);
app.use("/api/bhw-accounts", bhwAccountRoutes);

// Features
app.use("/api/keywords", keywordRoutes);
app.use("/api/task-executions", taskExecutionRoutes);
app.use("/api/ctr", ctrRoutes);

// Platform APIs
app.use("/api/reddit", redditRoutes);

// Admin APIs
app.use("/api/admin/reddit", adminRedditRoutes);
app.use("/api/admin/instagram", adminInstagramRoutes);
app.use("/api/admin/quora/dashboard", adminQuoraDashboardRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("CTR Monitor Backend Running ");
});

// ===== Cron startup (only when allowed) =====
if (process.env.ENABLE_CRON === "true") {
  startRedditCTRCron();
  startInstagramCTRCron();
}

module.exports = app;
