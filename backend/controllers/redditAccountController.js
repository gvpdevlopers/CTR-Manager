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
// exports.getMyRedditAccounts = async (req, res) => {
//   try {
//     const accounts = await RedditAccount.find({
//       ownerEmployeeId: req.user._id,
//     }).sort({ createdAt: -1 });

//     res.json(accounts);
//   } catch {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };

// ✅ ADMIN + EMPLOYEE — GET ALL (GLOBAL)
exports.getAllRedditAccounts = async (req, res) => {
  try {
    const accounts = await RedditAccount.find()
      .populate("ownerEmployeeId", "fullName username role")
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (err) {
    console.error("Reddit GET error:", err);
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ EMPLOYEE / ADMIN — INLINE UPDATE
exports.updateRedditAccount = async (req, res) => {
  try {
    const fields = ["userId", "name1", "email1", "password1", "name2", "email2", "password2", "status"];
    const updates = req.user?.role === "employee" ? Object.fromEntries(Object.entries(req.body).filter(([key]) => fields.includes(key))) : req.body;
    const updated = await RedditAccount.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Account not found" });
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ TOGGLE STATUS
exports.toggleRedditStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["working", "suspicious", "not_working"].includes(status)) return res.status(400).json({ message: "Invalid account status" });
    const acc = await RedditAccount.findById(req.params.id);
    if (!acc) return res.status(404).json({ message: "Account not found" });
    acc.status = status;
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
