const express = require("express");
const {
  runBHWCTRCheck,
  getBHWCTRStatus,
  getBHWCTRHistory,
  getBHWCTRDahboard,
} = require("../controllers/bhwCTRController");

const router = express.Router();

router.post("/run/:bhwAccountId", runBHWCTRCheck);
router.get("/status", getBHWCTRStatus);
router.get("/history/:bhwAccountId", getBHWCTRHistory);
router.get("/dashboard", getBHWCTRDahboard);

module.exports = router;
