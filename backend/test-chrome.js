// const { chromium } = require("playwright");

// (async () => {
//   console.log("Trying to launch Chrome...");

//   const browser = await chromium.launch({
//     headless: false,
//     channel: "chrome",
//     executablePath:
//       "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//   });

//   console.log("Chrome launched");

//   const page = await browser.newPage();
//   await page.goto("https://www.google.com");

//   console.log("Opened Google — waiting 10 seconds");
//   await new Promise((r) => setTimeout(r, 10000));

//   await browser.close();
// })();
