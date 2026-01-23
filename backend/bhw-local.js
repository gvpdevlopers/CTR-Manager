// const express = require("express");
// const { chromium } = require("playwright");
// const cheerio = require("cheerio");

// const app = express();

// let context;
// let page;

// async function initBrowser() {
//   console.log("🚀 Launching Chrome with REAL profile...");

//   context = await chromium.launchPersistentContext(
//     "C:\\Users\\ADMIN\\AppData\\Local\\Google\\Chrome\\User Data",
//     {
//       headless: false,
//       channel: "chrome",
//       executablePath:
//         "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//       args: [
//         "--start-maximized",
//         "--disable-blink-features=AutomationControlled",
//       ],
//     }
//   );

//   page = context.pages()[0] || (await context.newPage());
//   console.log("✅ Chrome ready (real profile)");
// }

// app.get("/bhw/:slug", async (req, res) => {
//   const slug = req.params.slug;
//   const url = `https://www.blackhatworld.com/members/${slug}/`;

//   console.log("▶ BHW fetch request:", slug);

//   try {
//     await page.goto(url, { timeout: 120000 });

//     // 🔑 Cloudflare-safe wait (NO load state)
//     await page.waitForTimeout(30000);

//     const html = await page.content();
//     const $ = cheerio.load(html);
//     const text = $("body").text();

//     const num = (label) => {
//       const m = text.match(new RegExp(label + "\\s*(\\d+)", "i"));
//       return m ? Number(m[1]) : 0;
//     };

//     const threadsText = $("a[href*='threads']").first().text();
//     const tm = threadsText.match(/Threads\\s*\\((\\d+)\\)/i);

//     const result = {
//       messages: num("Messages"),
//       reactionScore: num("Reaction score"),
//       threadsStarted: tm ? Number(tm[1]) : 0,
//       lastSeen: text.match(/Last seen:\\s*([^|]+)/i)?.[1]?.trim() || null,
//     };

//     console.log("✔ BHW data:", result);
//     res.json(result);
//   } catch (err) {
//     console.error("❌ BHW local error:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// initBrowser().then(() => {
//   app.listen(5050, () =>
//     console.log("🟢 Local BHW fetcher running on http://localhost:5050"),
//   );
// });
