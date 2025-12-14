const Keyword = require("../models/Keyword");

// ADMIN → CREATE
exports.createKeyword = async (req, res) => {
  const { keyword, platform } = req.body;

  if (!keyword || !platform) {
    return res.status(400).json({ message: "Keyword & platform required" });
  }

  const newKeyword = await Keyword.create({ keyword, platform });
  res.status(201).json(newKeyword);
};

// ADMIN + EMPLOYEE → READ
exports.getAllKeywords = async (req, res) => {
  const keywords = await Keyword.find().sort({ createdAt: -1 });
  res.json(keywords);
};

// ADMIN → DELETE
exports.deleteKeyword = async (req, res) => {
  await Keyword.findByIdAndDelete(req.params.id);
  res.json({ message: "Keyword deleted" });
};
