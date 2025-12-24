const express = require("express");
const QuoraAccount = require("../models/QuoraAccount");
const { fetchQuoraProfileData } = require("../services/quoraApify.service");
const { protect } = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/adminMiddleware");

const router = express.Router();

/* =========================
   CAPTURE QUORA BASELINE
   (ADMIN ONLY)
========================= */
router.post(
  "/quora-accounts/:id/capture-baseline",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;

      const account = await QuoraAccount.findById(id);

      if (!account) {
        return res.status(404).json({ message: "Quora account not found" });
      }

      if (!account.profileUrl) {
        return res
          .status(400)
          .json({ message: "Profile URL not set for this account" });
      }

      // Prevent accidental overwrite
      if (account.baselineCapturedAt) {
        return res.status(400).json({
          message: "Baseline already captured. Reset explicitly if required.",
        });
      }

      /* ======================
         FETCH PUBLIC DATA
      ====================== */
      const apifyResult = await fetchQuoraProfileData(account.profileUrl);

      if (!apifyResult.success) {
        return res.status(500).json({
          message: "Failed to fetch Quora data",
          error: apifyResult.error,
        });
      }

      const { totalAnswers, lastAnswerDate, runId } = apifyResult;

      /* ======================
         SAVE BASELINE
      ====================== */
      account.baselineAnswersCount = totalAnswers;
      account.baselineLastAnswerDate = lastAnswerDate;
      account.baselineCapturedAt = new Date();
      account.lastCheckedAt = new Date();
      account.ctrDone = false; // explicit safety

      await account.save();

      return res.json({
        success: true,
        message: "Baseline captured successfully",
        baseline: {
          answersCount: totalAnswers,
          lastAnswerDate,
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
