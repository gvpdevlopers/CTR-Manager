const RedditCTRCheck = require("../models/RedditCTRCheck");
const { businessDate } = require("../utils/businessDate");
const axios = require("axios");

const DAY_MS = 24 * 60 * 60 * 1000;
const POST_VALID_DAYS = 15;
const COMMENT_REQUIRED_PER_USER = 2;
const MAX_PAGES = 5;

// A truncated listing cannot establish absence of activity. Page until we see
// activity older than the window (or Reddit indicates there are no more pages).
async function fetchActivity(username, kind, cutoff, now) {
  let after;
  const activity = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await axios.get(
      `https://www.reddit.com/user/${encodeURIComponent(username)}/${kind}.json`,
      {
        params: { limit: 100, sort: "new", ...(after ? { after } : {}) },
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CTRMonitor/1.0)" },
      },
    );
    const listing = response.data?.data;
    if (!Array.isArray(listing?.children) || !Object.hasOwn(listing, "after") || !(listing.after === null || typeof listing.after === "string")) {
      throw new Error("Incomplete public Reddit listing");
    }
    let reachedCutoff = false;
    for (const item of listing.children) {
      const created = item?.data?.created_utc;
      if (typeof created !== "number" || !Number.isFinite(created) || created < 0 || created * 1000 > now) {
        throw new Error("Reddit activity timestamp is missing or invalid");
      }
      const time = created * 1000;
      if (time >= cutoff) activity.push(time);
      else reachedCutoff = true;
    }
    if (reachedCutoff || !listing.after) return activity;
    if (!listing.children.length || listing.after === after) throw new Error("Incomplete public Reddit listing");
    after = listing.after;
  }
  throw new Error("Reddit activity listing exceeded the verification limit");
}

async function verifyRedditCTR(ctrCheckId = null, { manual = false } = {}) {
  const checks = ctrCheckId
    ? await RedditCTRCheck.find({ _id: ctrCheckId })
    : await RedditCTRCheck.find({ date: businessDate() });

  for (const check of checks) {
    const now = Date.now();
    const users = [
      { name: check.username1?.trim(), key: "user1" },
      { name: check.username2?.trim(), key: "user2" },
    ].filter((user) => user.name);
    try {
      if (!users.length || users.some((user) => !/^[a-zA-Z0-9_-]{1,20}$/.test(user.name))) {
        throw new Error("A valid Reddit username is required");
      }
      const breakdown = {
        user1: { comments24h: 0, posts24h: 0 },
        user2: { comments24h: 0, posts24h: 0 },
      };
      let comments24h = 0;
      let latestPost = null;
      for (const user of users) {
        const comments = await fetchActivity(user.name, "comments", now - DAY_MS, now);
        const posts = await fetchActivity(user.name, "submitted", now - POST_VALID_DAYS * DAY_MS, now);
        breakdown[user.key].comments24h = comments.length;
        // Preserve this historical field, but count posts inside the 15-day window.
        breakdown[user.key].posts24h = posts.length;
        comments24h += comments.length;
        for (const post of posts) latestPost = Math.max(latestPost || 0, post);
      }
      const commentsRequired = users.length * COMMENT_REQUIRED_PER_USER;
      const postValidTill = latestPost === null ? null : new Date(latestPost + POST_VALID_DAYS * DAY_MS);
      const commentsOk = comments24h >= commentsRequired;
      const postsOk = postValidTill !== null;
      check.status = commentsOk && postsOk ? "done" : commentsOk || postsOk ? "suspicious" : "not_done";
      check.actual = { breakdown, comments24h, commentsRequired, postDone: postsOk, postValidTill };
      check.failureReasons = [];
    } catch (error) {
      check.status = "unavailable";
      check.actual = null;
      check.failureReasons = ["Unable to retrieve complete public Reddit activity. Please retry verification."];
      console.warn("Reddit verification unavailable:", error.response?.status || error.message);
    }
    check.verifiedAt = check.status === "unavailable" ? null : new Date();
    await check.save();
  }
  return { total: checks.length, manual };
}

module.exports = { verifyRedditCTR };
