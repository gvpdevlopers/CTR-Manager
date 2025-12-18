const mongoose = require("mongoose");
const { verifyRedditCTR } = require("../services/redditCTRVerifier");

(async () => {
  await mongoose.connect("mongodb://localhost:27017/ctr_manager");

  const ctrCheckId = "PUT_REAL_CTR_CHECK_ID_HERE";

  const result = await verifyRedditCTR(ctrCheckId);
  console.log(result);

  process.exit();
})();
