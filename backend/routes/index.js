const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("🚀 Roblox Trend API is running!");
});

module.exports = router;
