const axios = require("axios");
const { recordActorRun, recordActorStartIntent, getRecoveryActor } = require("./verificationRun.service");

const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = process.env.APIFY_QUORA_ACTOR_ID;

// console.log("🔹 APIFY_TOKEN present:", !!APIFY_TOKEN);
// console.log("🔹 APIFY_QUORA_ACTOR_ID:", ACTOR_ID);

if (!APIFY_TOKEN || !ACTOR_ID) {
  throw new Error("Apify token or actor ID missing in env");
}

async function fetchQuoraProfileData(profileUrl) {
  if (!profileUrl) throw new Error("profileUrl is required");

  try {
    const recoveredId = getRecoveryActor(profileUrl);
    if (!recoveredId) await recordActorStartIntent(profileUrl);
    const runResponse = recoveredId ? null : await axios.post(
      `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs`,
      {
        headless: true,
        launcher: "chromium",
        maxRequestsPerCrawl: 1,
        maxConcurrency: 1,

        pageFunction: `
async function pageFunction({ page, request, log }) {
  log.info(\`Opened \${request.url}\`);
  await page.waitForSelector("body", { timeout: 15000 });

  const result = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\\s+/g, " ");

    const extract = (regex) => {
      const match = text.match(regex);
      return match ? Number(match[1].replace(/,/g, "")) : null;
    };

    return {
      url: location.href,
      title: document.title,
      answers: extract(/([\\d,]+)\\s*answers?/i),
      questions: extract(/([\\d,]+)\\s*questions?/i),
      following: extract(/([\\d,]+)\\s*following/i),
    };
  });

  return result;
}
`,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
        },
        startUrls: [{ url: profileUrl }],
        waitUntil: "domcontentloaded",
        pageLoadTimeoutSecs: 45,
        maxRequestRetries: 0,
      },
      { headers: { Authorization: `Bearer ${APIFY_TOKEN}` }, params: { memory: 1024, timeout: 90, maxTotalChargeUsd: 0.05 }, timeout: 15000 }
    );

    const runId = recoveredId || runResponse.data?.data?.id;
    if (!runId) throw new Error("Failed to start Apify run");
    await recordActorRun(runId, "RUNNING", null, profileUrl);

    let runStatus = "RUNNING";
    let runData = null;

    while (runStatus === "RUNNING" || runStatus === "READY") {
      await new Promise((r) => setTimeout(r, 3000));

      const statusRes = await axios.get(
        `${APIFY_BASE_URL}/actor-runs/${runId}`,
        { headers: { Authorization: `Bearer ${APIFY_TOKEN}` }, timeout: 15000 }
      );

      runStatus = statusRes.data?.data?.status;
      runData = statusRes.data?.data;

      if (["FAILED", "ABORTED", "TIMED-OUT"].includes(runStatus)) {
        await recordActorRun(runId, runStatus, runData?.usageTotalUsd ?? null, null, runData?.finishedAt);
        throw new Error(`Apify run ${runStatus}`);
      }
    }

    await recordActorRun(runId, runStatus, runData?.usageTotalUsd ?? null, null, runData?.finishedAt);
    const datasetId = runData?.defaultDatasetId;
    if (!datasetId) throw new Error("No dataset found");

    const datasetRes = await axios.get(
      `${APIFY_BASE_URL}/datasets/${datasetId}/items`,
      { headers: { Authorization: `Bearer ${APIFY_TOKEN}` }, timeout: 15000 }
    );

    const items = datasetRes.data || [];

    if (!items.length || items[0]["#error"]) {
      throw new Error("Apify blocked or returned error dataset");
    }

    const profile = items[0];

    const { following, answers, questions } = profile;
    if (![following, answers, questions].every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new Error("Public profile data is missing required metrics");
    }

    console.log("📊 Parsed Quora metrics:", { following, answers, questions });

    return { success: true, runId, following, answers, questions };
  } catch (error) {
    console.error("❌ Quora Apify Error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { fetchQuoraProfileData };
