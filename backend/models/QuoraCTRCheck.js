// models/QuoraCTRCheck.js
const mongoose = require("mongoose");

const quoraCTRCheckSchema = new mongoose.Schema(
  {
    /* ======================
       REFERENCES
    ====================== */

    quoraAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuoraAccount",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    /* ======================
       EXPECTED (RULES SNAPSHOT)
       — frozen per day
    ====================== */

    expected: {
      minAnswers: {
        type: Number,
        default: 1,
      },
      answerFrequencyDays: {
        type: Number,
        default: 15,
      },
    },

    /* ======================
       ACTUAL (APIFY RESULT)
    ====================== */

    actual: {
      answersBefore: {
        type: Number,
        default: 0,
      },

      answersAfter: {
        type: Number,
        default: 0,
      },

      newAnswersCount: {
        type: Number,
        default: 0,
      },

      lastAnswerDate: {
        type: Date,
        default: null,
      },

      upvotesDelta: {
        type: Number,
        default: 0,
      },
    },

    /* ======================
       MANUAL DECLARATION
       (EMPLOYEE CHECKBOX)
    ====================== */

    manual: {
      markedDone: {
        type: Boolean,
        default: false,
      },

      notes: {
        type: String,
        default: "",
      },
    },

    /* ======================
       FINAL SYSTEM DECISION
    ====================== */

    status: {
      type: String,
      enum: ["pending", "done", "not_done", "suspicious"],
      default: "pending",
    },

    /* ======================
       SYSTEM / DEBUG
    ====================== */

    metadata: {
      apifyRunId: {
        type: String,
        default: null,
      },

      error: {
        type: String,
        default: null,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuoraCTRCheck", quoraCTRCheckSchema);
