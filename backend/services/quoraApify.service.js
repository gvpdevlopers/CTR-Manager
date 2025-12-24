// services/quoraApify.service.js
const axios = require("axios");

const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = process.env.APIFY_QUORA_ACTOR_ID;

if (!APIFY_TOKEN || !ACTOR_ID) {
  throw new Error("Apify token or actor ID missing in env");
}

/**
 * Fetch public Quora profile data using Apify
 * @param {String} profileUrl
 * @returns {Object} normalized data
 */
async function fetchQuoraProfileData(profileUrl) {
  if (!profileUrl) {
    throw new Error("profileUrl is required for Quora Apify fetch");
  }

  try {
    /* ======================
       1. START ACTOR RUN
    ====================== */
    const runResponse = await axios.post(
      `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs`,
      { profileUrl },
      {
        params: { token: APIFY_TOKEN },
        headers: { "Content-Type": "application/json" },
      }
    );

    const runId = runResponse.data?.data?.id;
    if (!runId) {
      throw new Error("Failed to start Apify run");
    }

    /* ======================
       2. WAIT FOR RUN
    ====================== */
    let runStatus = "RUNNING";
    let runData = null;

    while (runStatus === "RUNNING" || runStatus === "READY") {
      await new Promise((r) => setTimeout(r, 3000));

      const statusRes = await axios.get(
        `${APIFY_BASE_URL}/actor-runs/${runId}`,
        { params: { token: APIFY_TOKEN } }
      );

      runStatus = statusRes.data?.data?.status;
      runData = statusRes.data?.data;

      if (runStatus === "FAILED" || runStatus === "ABORTED") {
        throw new Error(`Apify run ${runStatus}`);
      }
    }

    /* ======================
       3. FETCH DATASET ITEMS
    ====================== */
    const datasetId = runData?.defaultDatasetId;
    if (!datasetId) {
      throw new Error("No dataset found for Apify run");
    }

    const datasetRes = await axios.get(
      `${APIFY_BASE_URL}/datasets/${datasetId}/items`,
      { params: { token: APIFY_TOKEN } }
    );

    const items = datasetRes.data || [];

    /* ======================
       4. NORMALIZE OUTPUT
    ====================== */
    let totalAnswers = 0;
    let answers = [];

    if (items.length > 0) {
      const profile = items[0];

      totalAnswers = profile.totalAnswers || 0;

      answers = Array.isArray(profile.answers)
        ? profile.answers.map((a) => ({
            url: a.url || null,
            createdAt: a.createdAt ? new Date(a.createdAt) : null,
            upvotes: Number(a.upvotes || 0),
          }))
        : [];
    }

    const lastAnswerDate =
      answers.length > 0
        ? answers
            .map((a) => a.createdAt)
            .filter(Boolean)
            .sort((a, b) => b - a)[0]
        : null;

    const upvotesTotal = answers.reduce((sum, a) => sum + (a.upvotes || 0), 0);

    return {
      success: true,
      runId,
      totalAnswers,
      lastAnswerDate,
      upvotesTotal,
      answers,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Quora Apify fetch failed",
    };
  }
}

module.exports = {
  fetchQuoraProfileData,
};
