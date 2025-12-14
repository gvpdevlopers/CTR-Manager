const RedditAccount = require("../models/RedditAccount");
const { parse } = require("json2csv");

// ✅ EMPLOYEE / ADMIN — CREATE SINGLE
exports.createRedditAccount = async (req, res) => {
  try {
    const { userId, name1, email1, password1, name2, email2, password2 } =
      req.body;

    const account = await RedditAccount.create({
      ownerEmployeeId: req.user._id,
      userId,
      name1,
      email1,
      password1,
      name2,
      email2,
      password2,
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: "Failed to create Reddit account" });
  }
};

// ✅ EMPLOYEE — GET OWN
exports.getMyRedditAccounts = async (req, res) => {
  try {
    const accounts = await RedditAccount.find({
      ownerEmployeeId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(accounts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ ADMIN — GET ALL
exports.getAllRedditAccounts = async (req, res) => {
  try {
    const accounts = await RedditAccount.find().populate(
      "ownerEmployeeId",
      "fullName username"
    );

    res.json(accounts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ EMPLOYEE / ADMIN — INLINE UPDATE
exports.updateRedditAccount = async (req, res) => {
  try {
    const updated = await RedditAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ TOGGLE STATUS
exports.toggleRedditStatus = async (req, res) => {
  try {
    const acc = await RedditAccount.findById(req.params.id);
    acc.status = acc.status === "working" ? "not_working" : "working";
    await acc.save();

    res.json(acc);
  } catch {
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ✅ DELETE
exports.deleteRedditAccount = async (req, res) => {
  try {
    await RedditAccount.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

// ✅ ADMIN — CSV EXPORT
exports.exportRedditCSV = async (req, res) => {
  try {
    const accounts = await RedditAccount.find().populate(
      "ownerEmployeeId",
      "fullName"
    );

    const csv = parse(accounts);

    res.header("Content-Type", "text/csv");
    res.attachment("reddit_accounts.csv");
    res.send(csv);
  } catch {
    res.status(500).json({ message: "CSV export failed" });
  }
};
