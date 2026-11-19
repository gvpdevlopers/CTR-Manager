const QuoraAccount = require("../models/QuoraAccount");
const { parse } = require("json2csv");

function buildQuoraProfileUrl(username) {
  return `https://www.quora.com/profile/${encodeURIComponent(username)}`;
}

// ✅ EMPLOYEE / ADMIN — CREATE SINGLE
function normalizeQuoraProfileUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["quora.com", "www.quora.com"].includes(url.hostname.toLowerCase()) || url.username || url.password || url.port || !/^\/profile\/[^/]+\/?$/.test(url.pathname)) return null;
    return `https://www.quora.com${url.pathname.replace(/\/$/, "")}`;
  } catch { return null; }
}

exports.createQuoraAccount = async (req, res) => {
  try {
    const { userId, name1, email1, password1, name2, email2, password2 } =
      req.body;

    const profileUrl = req.body.profileUrl ? normalizeQuoraProfileUrl(req.body.profileUrl) : buildQuoraProfileUrl(name1);
    if (!profileUrl) return res.status(400).json({ message: "Enter a valid HTTPS Quora profile URL." });

    const account = await QuoraAccount.create({
      ownerEmployeeId: req.user._id,
      userId,
      name1,
      email1,
      password1,
      name2,
      email2,
      password2,
      username: name1,
      profileUrl,
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: "Failed to create Quora account" });
  }
};

// ✅ EMPLOYEE — GET OWN
// exports.getMyQuoraAccounts = async (req, res) => {
//   try {
//     const accounts = await QuoraAccount.find({
//       ownerEmployeeId: req.user._id,
//     }).sort({ createdAt: -1 });

//     res.json(accounts);
//   } catch {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };

// ✅ ADMIN + EMPLOYEE — GET ALL (GLOBAL)
exports.getAllQuoraAccounts = async (req, res) => {
  try {
    const accounts = await QuoraAccount.find()
      .populate("ownerEmployeeId", "fullName username role")
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (err) {
    console.error("Quora GET error:", err);
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
    const fields = ["userId", "name1", "email1", "password1", "name2", "email2", "password2", "profileUrl", "status", "resetBaseline"];
    const updates = req.user?.role === "employee" ? Object.fromEntries(Object.entries(req.body).filter(([key]) => fields.includes(key))) : { ...req.body };
    const resetBaseline = updates.resetBaseline === true;
    delete updates.resetBaseline;
    if (updates.profileUrl !== undefined) {
      const normalized = normalizeQuoraProfileUrl(updates.profileUrl);
      if (!normalized) return res.status(400).json({ message: "Enter a valid HTTPS Quora profile URL." });
      const account = await QuoraAccount.findById(req.params.id);
      if (!account) return res.status(404).json({ message: "Account not found" });
      if (account.baselineCapturedAt && account.profileUrl !== normalized && !resetBaseline) {
        return res.status(409).json({ message: "This account has a baseline. Review it before changing the profile URL." });
      }
      if (account.baselineCapturedAt && account.profileUrl !== normalized && resetBaseline) {
        updates.baselineFollowing = null;
        updates.baselineAnswers = null;
        updates.baselineQuestions = null;
        updates.baselineCapturedAt = null;
        updates.baselineAnswersCount = null;
        updates.baselineLastAnswerDate = null;
      }
      updates.profileUrl = normalized;
    }
    const updated = await QuoraAccount.findByIdAndUpdate(
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
exports.toggleQuoraStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["working", "suspicious", "not_working"].includes(status)) {
      return res.status(400).json({ message: "Invalid account status" });
    }
    const acc = await QuoraAccount.findById(req.params.id);
    if (!acc) return res.status(404).json({ message: "Account not found" });
    acc.status = status;
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
