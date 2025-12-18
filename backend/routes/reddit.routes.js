const express = require("express");
const router = express.Router();
const { markCTRDone } = require("../controllers/redditCTR.controller");
const { protect } = require("../middlewares/authMiddleware");

router.post("/ctr-done", protect, markCTRDone);

module.exports = router;
