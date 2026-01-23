const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

const PROFILE_PATH = "C:\\Users\\ADMIN\\bhw-playwright-profile";
const SESSION_FILE = path.join(__dirname, "bhw.session.json");

async function createDriver() {
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

  return driver;
}

async function saveSession(driver) {
  const cookies = await driver.manage().getCookies();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
}

module.exports = { createDriver, saveSession };
