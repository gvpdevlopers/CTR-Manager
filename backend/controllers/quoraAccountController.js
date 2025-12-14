const QuoraAccount = require("../models/QuoraAccount");
const { parse } = require("json2csv");

// ✅ EMPLOYEE / ADMIN — CREATE SINGLE
exports.createQuoraAccount = async (req, res) => {
  try {
    const { userId, name1, email1, password1, name2, email2, password2 } =
      req.body;

    const account = await QuoraAccount.create({
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
    res.status(500).json({ message: "Failed to create Quora account" });
  }
};

// ✅ EMPLOYEE — GET OWN
exports.getMyQuoraAccounts = async (req, res) => {
  try {
    const accounts = await QuoraAccount.find({
      ownerEmployeeId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(accounts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ ADMIN — GET ALL
exports.getAllQuoraAccounts = async (req, res) => {
  try {
    const accounts = await QuoraAccount.find().populate(
      "ownerEmployeeId",
      "fullName username"
    );

    res.json(accounts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ EMPLOYEE / ADMIN — INLINE UPDATE
exports.updateQuoraAccount = async (req, res) => {
  try {
    const updated = await QuoraAccount.findByIdAndUpdate(
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
exports.toggleQuoraStatus = async (req, res) => {
  try {
    const acc = await QuoraAccount.findById(req.params.id);
    acc.status = acc.status === "working" ? "not_working" : "working";
    await acc.save();

    res.json(acc);
  } catch {
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ✅ DELETE
exports.deleteQuoraAccount = async (req, res) => {
  try {
    await QuoraAccount.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

// ✅ ADMIN — CSV EXPORT
exports.exportQuoraCSV = async (req, res) => {
  try {
    const accounts = await QuoraAccount.find().populate(
      "ownerEmployeeId",
      "fullName"
    );

    const csv = parse(accounts);

    res.header("Content-Type", "text/csv");
    res.attachment("quora_accounts.csv");
    res.send(csv);
  } catch {
    res.status(500).json({ message: "CSV export failed" });
  }
};
