const express = require("express");
const router = express.Router();
const {
  runInstagramCTRCheck,
} = require("../controllers/instagramCTR.controller");
const auth = require("../middlewares/auth");

router.post("/run", auth, runInstagramCTRCheck);

module.exports = router;
