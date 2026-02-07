const express = require("express");
const QuoraAccount = require("../models/QuoraAccount");
const { fetchQuoraProfileData } = require("../services/quoraApify.service");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const { verifyQuoraNow } = require("../controllers/adminQuoraCTR.controller");

const router = express.Router();

router.post("/verify-now", protect, isAdmin, verifyQuoraNow);

/* =========================
   CAPTURE QUORA BASELINE
   (ADMIN ONLY)
========================= */
router.post(
  "/quora-accounts/:id/capture-baseline",
  protect,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { force } = req.query; // ?force=true to overwrite

      const account = await QuoraAccount.findById(id);

      if (!account) {
        return res.status(404).json({ message: "Quora account not found" });
      }

      if (!account.profileUrl) {
        return res
          .status(400)
          .json({ message: "Profile URL not set for this account" });
      }

      /* ======================
         BASELINE EXISTS HANDLING
      ====================== */

      if (account.baselineCapturedAt && force !== "true") {
        return res.status(200).json({
          success: true,
          message: "Baseline already exists",
          baseline: {
            following: account.baselineFollowing,
            answers: account.baselineAnswers,
            questions: account.baselineQuestions,
          },
          note: "Use ?force=true to overwrite baseline",
        });
      }

      /* ======================
         FETCH PUBLIC DATA
      ====================== */
      const apifyResult = await fetchQuoraProfileData(account.profileUrl);

      if (!apifyResult.success) {
        return res.status(200).json({
          success: false,
          message: "Scraper failed — baseline not changed",
          error: apifyResult.error,
        });
      }

      const { following, answers, questions, runId } = apifyResult;

      /* ======================
         SAVE / OVERWRITE BASELINE
      ====================== */
      account.baselineFollowing = following;
      account.baselineAnswers = answers;
      account.baselineQuestions = questions;
      account.baselineCapturedAt = new Date();

      await account.save();

      return res.json({
        success: true,
        message:
          force === "true"
            ? "Baseline overwritten successfully"
            : "Baseline captured successfully",
        baseline: {
          following,
          answers,
          questions,
          capturedAt: account.baselineCapturedAt,
        },
        metadata: {
          apifyRunId: runId,
        },
      });
    } catch (err) {
      console.error("❌ BASELINE CAPTURE ERROR:", err);
      return res.status(500).json({ message: "Baseline capture failed" });
    }
  }
);

module.exports = router;
