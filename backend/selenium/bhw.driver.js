const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

let driver; // long-living driver

async function createDriver() {
  if (driver) {
    return driver;
  }

  console.log("🚀 Starting long-living Chrome session...");

  const options = new chrome.Options();
  options.addArguments(
    "--start-maximized",
    "--disable-blink-features=AutomationControlled"
  );

  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  console.log("✅ Chrome session ready");
  return driver;
}

function getDriver() {
  if (!driver) {
    throw new Error("Driver not initialized");
  }
  return driver;
}

module.exports = {
  createDriver,
  getDriver,
};
