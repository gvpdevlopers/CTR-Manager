// services/bhwService.js
const axios = require("axios");

async function fetchBHWProfile(slug) {
  console.log("➡ API calling Selenium worker:", slug);

  const res = await axios.get(`http://localhost:5051/fetch/${slug}`, {
    timeout: 300000,
  });

  return res.data;
}

module.exports = { fetchBHWProfile };
