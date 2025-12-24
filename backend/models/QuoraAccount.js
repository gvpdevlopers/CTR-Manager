// models/QuoraAccount.js
const mongoose = require("mongoose");

const quoraAccountSchema = new mongoose.Schema(
  {
    /* ======================
       EXISTING FIELDS (DO NOT CHANGE)
    ====================== */

    ownerEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userId: {
      type: String,
      required: true,
    },

    // First User
    name1: { type: String, required: true },
    email1: { type: String, required: true },
    password1: { type: String, required: true },

    // Second User
    name2: { type: String, required: true },
    email2: { type: String, required: true },
    password2: { type: String, required: true },

    status: {
      type: String,
      enum: ["working", "suspicious", "not_working"],
      default: "working",
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },

    ctrDone: {
      type: Boolean,
      default: false,
    },

    /* ======================
       NEW FIELDS (NON-BREAKING)
       FOR QUORA CTR VERIFICATION
    ====================== */

    profileUrl: {
      type: String,
      trim: true,
      default: null,
    },

    username: {
      type: String,
      trim: true,
      default: null,
    },

    // BASELINE SNAPSHOT (Apify)
    baselineAnswersCount: {
      type: Number,
      default: null,
    },

    baselineLastAnswerDate: {
      type: Date,
      default: null,
    },

    baselineCapturedAt: {
      type: Date,
      default: null,
    },

    // INTERNAL FLAGS (SAFE EXTENSION)
    verificationEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuoraAccount", quoraAccountSchema);
