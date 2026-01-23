const { Builder, By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

// const PROFILE_PATH = "C:\\bhw_selenium_profile";
const PROFILE_PATH = "C:\\Users\\ADMIN\\bhw-playwright-profile";
const BHW_URL = "https://www.blackhatworld.com/members/prakash07dz.2272143/";

(async function testBHW() {
  const options = new chrome.Options();

  options.addArguments(
    `user-data-dir=${PROFILE_PATH}`,
    "--start-maximized",
    "--disable-blink-features=AutomationControlled",
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    console.log("Opening BHW profile...");
    await driver.get(BHW_URL);

    console.log(
      "If Cloudflare appears, solve it manually. Waiting 30 seconds...",
    );

    await driver.sleep(30000); // manual Cloudflare solve time

    const bodyText = await driver.findElement(By.tagName("body")).getText();

    const extract = (label) => {
      const regex = new RegExp(label + "\\s*(\\d+)", "i");
      const match = bodyText.match(regex);
      return match ? match[1] : null;
    };

    console.log("Messages:", extract("Messages"));
    console.log("Reaction score:", extract("Reaction score"));
  } catch (err) {
    console.error("Selenium test failed:", err.message);
  } finally {
    console.log("Test finished. Browser will stay open.");
  }
})();
