const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

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

const { startRedditCTRCron } = require("./cron/redditCTR.cron");

const app = express();

// Connect Database
connectDB();

startRedditCTRCron();

// Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/platform-accounts", platformAccountRoutes);
app.use("/api/platform-tasks", platformTaskRoutes);
app.use("/api/instagram-accounts", instagramAccountRoutes);
app.use("/api/reddit-accounts", redditAccountRoutes);
app.use("/api/quora-accounts", quoraAccountRoutes);
app.use("/api/bhw-accounts", bhwAccountRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/task-executions", taskExecutionRoutes);
app.use("/api/ctr", ctrRoutes);
app.use("/api/reddit", require("./routes/reddit.routes"));
app.use("/api/admin/reddit", require("./routes/admin.reddit.routes"));

// Test Route
app.get("/", (req, res) => {
  res.send("CTR Monitor Backend Running ✅");
});

module.exports = app;
