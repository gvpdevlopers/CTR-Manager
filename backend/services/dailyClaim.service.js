const { businessDate, claimDateRange } = require("../utils/businessDate");
﻿const crypto = require("crypto");
const mongoose = require("mongoose");
const TaskExecution = require("../models/TaskExecution");
const InstagramAccount = require("../models/InstagramAccount");
const QuoraAccount = require("../models/QuoraAccount");

// Dates are stored as UTC midnight for the server's current business date,
// matching the existing daily claim format.
function todayKey() {
  return businessDate();
}

async function markSharedClaim({ accountId, platform, employeeId }) {
  const models = { instagram: InstagramAccount, quora: QuoraAccount };
  if (!models[platform] || !mongoose.isValidObjectId(accountId)) {
    const error = new Error("Invalid platform or account"); error.status = 400; throw error;
  }
  accountId = new mongoose.Types.ObjectId(accountId).toHexString();
  if (!(await models[platform].exists({ _id: accountId }))) {
    const error = new Error("Account not found"); error.status = 404; throw error;
  }
  const day = todayKey();
  const { start, end } = claimDateRange(day);
  const filter = { accountId, platform, taskId: "daily_ctr", taskDate: { $gte: start, $lt: end } };
  const existing = await TaskExecution.findOne(filter).sort({ markedDoneAt: 1, _id: 1 });
  if (existing) return existing;

  // A stable ObjectId makes simultaneous claims for the same account/day
  // converge on MongoDB's existing _id unique index, even with autoIndex off.
  const hash = crypto.createHash("sha256").update(`${platform}:${accountId}:daily_ctr:${day}`).digest("hex").slice(0, 24);
  const _id = new mongoose.Types.ObjectId(hash);
  try {
    return await TaskExecution.findOneAndUpdate(
      { _id },
      { $setOnInsert: { accountId, platform, employeeId, taskId: "daily_ctr", taskDate: start, markedDoneAt: new Date() } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      const claim = await TaskExecution.findById(_id);
      if (claim) return claim;
    }
    throw error;
  }
}

module.exports = { markSharedClaim };
