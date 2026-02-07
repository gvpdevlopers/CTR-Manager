const { By, until } = require("selenium-webdriver");
const { createDriver } = require("./bhw.driver");

async function getBodyText(driver) {
  for (let i = 0; i < 3; i++) {
    try {
      const body = await driver.findElement(By.tagName("body"));
      return await body.getText();
    } catch (err) {
      if (err.name === "StaleElementReferenceError") {
        console.log("🔁 Retrying stale body reference...");
        await driver.sleep(1000);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to read body text after retries");
}

async function fetchBHWProfile(slug) {
  console.log("🧪 [SCRAPER] start:", slug);

  const driver = await createDriver();
  const url = `https://www.blackhatworld.com/members/${slug}/`;

  try {
    console.log("🌐 Opening:", url);
    await driver.get(url);

   // 1️⃣ Wait for navigation to fully settle
await driver.wait(async () => {
  const state = await driver.executeScript("return document.readyState");
  return state === "complete";
}, 120000);

console.log("✅ Document ready");

// 2️⃣ Small buffer for BHW JS hydration
await driver.sleep(3000);

// 3️⃣ Now wait for profile content
await driver.wait(
  until.elementLocated(By.xpath("//*[contains(text(),'Messages')]")),
  120000
);

const threadsStarted = await fetchThreadsStarted(driver, slug);

console.log("✅ Profile content detected");

    // Buffer for ads / hydration
    await driver.sleep(3000);

    const bodyText = await getBodyText(driver);

    const extract = (label) => {
      const m = bodyText.match(new RegExp(label + "\\s*(\\d+)", "i"));
      return m ? Number(m[1]) : 0;
    };

const result = {
  messages: extract("Messages"),
  reactionScore: extract("Reaction score"),
  threadsStarted,
};
    console.log("📊 Extracted:", result);
    return result;
  } catch (err) {
    console.error("❌ Scraper failed:", err.message);
    throw err;
  }
}

async function fetchThreadsStarted(driver, slug) {
  const recentUrl = `https://www.blackhatworld.com/members/${slug}/#recent-content`;

  try {
    console.log("🧵 Opening recent content:", recentUrl);
    await driver.get(recentUrl);

    await driver.wait(
      until.elementsLocated(By.css(".structItem")),
      30000
    );

    const items = await driver.findElements(By.css(".structItem"));
    let threadsToday = 0;

    for (const item of items) {
      const text = await item.getText();

      // Must explicitly be a THREAD
      if (!text.includes("Thread")) continue;

      // Must be created TODAY
      if (
        text.includes("Today") ||
        text.match(/\b\d+\s+minutes?\s+ago\b/i) ||
        text.match(/\b\d+\s+hours?\s+ago\b/i)
      ) {
        threadsToday++;
      }
    }

    console.log("🧵 Threads created today:", threadsToday);
    return threadsToday;
  } catch (err) {
    console.warn("⚠️ Thread detection failed:", err.message);
    return 0;
  }
}




module.exports = { fetchBHWProfile, fetchThreadsStarted };
