const axios = require("axios");

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
    const runResponse = await axios.post(
      `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs`,
      {
        headless: false,
        launcher: "chromium",
        useChrome: true,
        stealth: true,
        maxRequestsPerCrawl: 1,

        pageFunction: `
async function pageFunction({ page, request, log }) {
  log.info(\`Opened \${request.url}\`);
  await page.waitForSelector("body", { timeout: 15000 });

  const result = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\\s+/g, " ");

    const extract = (regex) => {
      const match = text.match(regex);
      return match ? Number(match[1]) : 0;
    };

    return {
      url: location.href,
      title: document.title,
      answers: extract(/(\\d+)\\s*answers?/i),
      questions: extract(/(\\d+)\\s*questions?/i),
      following: extract(/(\\d+)\\s*following/i),
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
        pageLoadTimeoutSecs: 90,
        maxRequestRetries: 2,
      },
      { params: { token: APIFY_TOKEN } }
    );

    const runId = runResponse.data?.data?.id;
    if (!runId) throw new Error("Failed to start Apify run");

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

      if (["FAILED", "ABORTED"].includes(runStatus)) {
        throw new Error(`Apify run ${runStatus}`);
      }
    }

    const datasetId = runData?.defaultDatasetId;
    if (!datasetId) throw new Error("No dataset found");

    const datasetRes = await axios.get(
      `${APIFY_BASE_URL}/datasets/${datasetId}/items`,
      { params: { token: APIFY_TOKEN } }
    );

    const items = datasetRes.data || [];
    console.log("📦 Apify raw dataset:", JSON.stringify(items, null, 2));

    if (!items.length || items[0]["#error"]) {
      throw new Error("Apify blocked or returned error dataset");
    }

    const profile = items[0];

    const following = Number(profile.following || 0);
    const answers = Number(profile.answers || 0);
    const questions = Number(profile.questions || 0);

    console.log("📊 Parsed Quora metrics:", { following, answers, questions });

    return { success: true, runId, following, answers, questions };
  } catch (error) {
    console.error("❌ Quora Apify Error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { fetchQuoraProfileData };
