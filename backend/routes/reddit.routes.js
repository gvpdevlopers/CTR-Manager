const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  markCTRDone,
  getMyTodayCTR,
} = require("../controllers/redditCTR.controller");

router.get("/ctr/my-today", protect, getMyTodayCTR);
router.post("/ctr-done", protect, markCTRDone);

module.exports = router;
