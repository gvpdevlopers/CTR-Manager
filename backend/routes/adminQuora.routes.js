const express = require("express");
const QuoraAccount = require("../models/QuoraAccount");
const { fetchQuoraProfileData } = require("../services/quoraApify.service");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const { verifyQuoraNow, getQuoraVerificationStatus } = require("../controllers/adminQuoraCTR.controller");
const { runWithLock } = require("../services/verificationRun.service");

const router = express.Router();

router.post("/verify-now", protect, isAdmin, verifyQuoraNow);
router.get("/quora/verification-status", protect, isAdmin, getQuoraVerificationStatus);

/* =========================
   CAPTURE QUORA BASELINE
   (ADMIN ONLY)
========================= */
router.post(
  "/quora-accounts/:id/capture-baseline",
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { force } = req.query; // ?force=true to overwrite
      if (force === "true" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only an admin can overwrite an existing baseline." });
      }

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
      const locked = await runWithLock("quora", async () => {
        const current = await QuoraAccount.findById(id);
        if (!current || !current.profileUrl) throw new Error("Quora account or profile no longer exists");
        if (current.baselineCapturedAt && force !== "true") {
          return { success: true, message: "Baseline already exists" };
        }
        const profileUrl = current.profileUrl;
        const apifyResult = await fetchQuoraProfileData(profileUrl);

        if (!apifyResult.success) {
          return {
          success: false,
          message: "Scraper failed — baseline not changed",
          error: apifyResult.error,
          };
        }

      const { following, answers, questions, runId } = apifyResult;

      /* ======================
         SAVE / OVERWRITE BASELINE
      ====================== */
        const capturedAt = new Date();
        const updated = await QuoraAccount.findOneAndUpdate(
          { _id: id, profileUrl, ...(force !== "true" ? { baselineCapturedAt: null } : {}) },
          { $set: { baselineFollowing: following, baselineAnswers: answers, baselineQuestions: questions, baselineCapturedAt: capturedAt } },
          { new: true }
        );
        if (!updated) throw new Error("Account or profile changed while capturing the baseline; retry after reviewing it");
        return {
        success: true,
        message:
          force === "true"
            ? "Baseline overwritten successfully"
            : "Baseline captured successfully",
        baseline: {
          following,
          answers,
          questions,
          capturedAt,
        },
        metadata: {
          apifyRunId: runId,
        },
        };
      }, { operation: "baseline" });
      if (!locked.started) return res.status(409).json({ success: false, message: "Quora verification or baseline capture is already running." });
      return res.json(locked.result);
    } catch (err) {
      console.error("❌ BASELINE CAPTURE ERROR:", err);
      return res.status(500).json({ message: "Baseline capture failed" });
    }
  }
);

module.exports = router;
