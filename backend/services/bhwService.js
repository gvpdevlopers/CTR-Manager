const axios = require("axios");
const cheerio = require("cheerio");

async function fetchBHWProfile(usernameOrId) {
  const profileUrl = `https://www.blackhatworld.com/members/${usernameOrId}/`;

  let html;

  try {
    const res = await axios.get(profileUrl, {
      timeout: 20000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.blackhatworld.com/",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      validateStatus: (status) => status < 500,
    });

    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status} while fetching BHW profile`);
    }

    html = res.data;
  } catch (err) {
    throw new Error(`BHW fetch failed: ${err.message}`);
  }

  const $ = cheerio.load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const extractNumber = (regex) => {
    const m = bodyText.match(regex);
    return m ? Number(m[1]) : null;
  };

  const extractText = (regex) => {
    const m = bodyText.match(regex);
    return m ? m[1].trim() : null;
  };

  const username = $(".memberHeader-name span").first().text().trim() || null;

  const messages = extractNumber(/Messages\s*(\d+)/i);
  const reactionScore = extractNumber(/Reaction score\s*(\d+)/i);
  const lastSeen = extractText(/Last seen:\s*([^|]+?)(?:\s{2,}|$)/i);

  return {
    username,
    messages,
    reactionScore,
    lastSeen,
    profileUrl,
    fetchedAt: new Date(),
  };
}

module.exports = { fetchBHWProfile };
