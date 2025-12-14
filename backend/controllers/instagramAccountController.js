const InstagramAccount = require("../models/InstagramAccount");
const json2csv = require("json2csv").parse;

// ✅ EMPLOYEE / ADMIN — CREATE SINGLE ACCOUNT
exports.createInstagramAccount = async (req, res) => {
  try {
    const { name, username, password, link } = req.body;

    const account = await InstagramAccount.create({
      ownerEmployeeId: req.user._id,
      name,
      username,
      password,
      link,
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: "Failed to create account" });
  }
};

// ✅ EMPLOYEE — GET OWN ACCOUNTS
exports.getMyInstagramAccounts = async (req, res) => {
  try {
    const accounts = await InstagramAccount.find({
      ownerEmployeeId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(accounts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ ADMIN — GET ALL ACCOUNTS
exports.getAllInstagramAccounts = async (req, res) => {
  try {
    const accounts = await InstagramAccount.find().populate(
      "ownerEmployeeId",
      "fullName username"
    );

    res.json(accounts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ EMPLOYEE / ADMIN — INLINE UPDATE
exports.updateInstagramAccount = async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await InstagramAccount.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
};

// ✅ TOGGLE STATUS
exports.toggleInstagramStatus = async (req, res) => {
  const { status } = req.body;

  const updated = await InstagramAccount.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(updated);
};

// ✅ DELETE
exports.deleteInstagramAccount = async (req, res) => {
  try {
    await InstagramAccount.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

// ✅ ADMIN — CSV EXPORT
exports.exportInstagramCSV = async (req, res) => {
  try {
    const accounts = await InstagramAccount.find().populate(
      "ownerEmployeeId",
      "fullName"
    );

    const csv = json2csv(accounts);

    res.header("Content-Type", "text/csv");
    res.attachment("instagram_accounts.csv");
    res.send(csv);
  } catch {
    res.status(500).json({ message: "CSV export failed" });
  }
};
