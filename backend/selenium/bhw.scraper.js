const { By, until } = require("selenium-webdriver");
const { createDriver } = require("./bhw.driver");

async function fetchBHWProfile(slug) {
  console.log("🧪 [SCRAPER] start for:", slug);

  const driver = await createDriver();
  const url = `https://www.blackhatworld.com/members/${slug}/`;

  try {
    console.log("🌐 Opening:", url);
    await driver.get(url);

    // ⏳ Wait until REAL profile content appears
    await driver.wait(
      until.elementLocated(By.css(".memberHeader-name")),
      120000,
    );

    console.log("✅ Profile page detected");

    const bodyText = await driver.findElement(By.tagName("body")).getText();

    const extract = (label) => {
      const m = bodyText.match(new RegExp(label + "\\s*(\\d+)", "i"));
      return m ? Number(m[1]) : 0;
    };

    const result = {
      messages: extract("Messages"),
      reactionScore: extract("Reaction score"),
      threadsStarted: extract("Threads"),
      lastSeen: null,
    };

    console.log("📊 Extracted:", result);
    return result;
  } catch (err) {
    console.error("❌ Selenium scraper failed:", err.message);
    throw err;
  }
}

module.exports = { fetchBHWProfile };
