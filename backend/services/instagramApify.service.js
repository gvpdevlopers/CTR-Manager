const { ApifyClient } = require("apify-client");

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

async function fetchInstagramProfile(username) {
  const run = await client.actor("apify/instagram-profile-scraper").call({
    usernames: [username],
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return items[0];
}

module.exports = { fetchInstagramProfile };
