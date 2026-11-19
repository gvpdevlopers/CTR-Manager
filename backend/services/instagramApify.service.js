const { ApifyClient } = require("apify-client");
const { recordActorRun, recordActorStartIntent, getRecoveryActor } = require("./verificationRun.service");

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

async function fetchInstagramProfile(username) {
  const target = username.trim().toLowerCase();
  const recoveredId = getRecoveryActor(target);
  if (!recoveredId) await recordActorStartIntent(target);
  const started = recoveredId ? await client.run(recoveredId).get() : await client.actor("apify/instagram-profile-scraper").start({
    usernames: [username],
  }, { timeout: 120 });
  if (!started) throw new Error("Previous Instagram actor run was not found");
  await recordActorRun(started.id, started.status, started.usageTotalUsd ?? null, target);
  const run = await client.run(started.id).waitForFinish({ waitSecs: 150 });
  await recordActorRun(run.id, run.status, run.usageTotalUsd ?? null, null, run.finishedAt);
  if (run.status !== "SUCCEEDED") throw new Error(`Instagram actor ${run.status}`);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return items[0];
}

module.exports = { fetchInstagramProfile };
