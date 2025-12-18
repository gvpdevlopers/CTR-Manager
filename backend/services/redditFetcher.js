const axios = require("axios");

exports.fetchUserJSON = async (username) => {
  const url = `https://www.reddit.com/user/${username}/.json`;

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CTRMonitor/1.0",
    },
    timeout: 10000,
  });

  return response.data?.data?.children || [];
};
