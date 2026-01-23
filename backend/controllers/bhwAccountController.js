const BhwAccount = require("../models/BhwAccount");
const { parse } = require("json2csv");

// ✅ EMPLOYEE / ADMIN — CREATE SINGLE
exports.createBhwAccount = async (req, res) => {
  try {
    const { userId, name, email, password, link } = req.body;

    const account = await BhwAccount.create({
      ownerEmployeeId: req.user._id,
      userId,
      name,
      email,
      password,
      link,
    });

    res.status(201).json(account);
  } catch {
    res.status(500).json({ message: "Failed to create BHW account" });
  }
};

// ✅ EMPLOYEE — GET OWN
// exports.getMyBhwAccounts = async (req, res) => {
//   try {
//     const accounts = await BhwAccount.find({
//       ownerEmployeeId: req.user._id,
//     }).sort({ createdAt: -1 });

//     res.json(accounts);
//   } catch {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };



// ✅ ADMIN + EMPLOYEE — GET ALL (GLOBAL)
exports.getAllBhwAccounts = async (req, res) => {
  try {
    const accounts = await BhwAccount.find()
      .populate("ownerEmployeeId", "fullName username role")
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (err) {
    console.error("BHW GET error:", err);
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ ADMIN — GET ALL
exports.getAllBhwAccounts = async (req, res) => {
  try {
    const accounts = await BhwAccount.find().populate(
      "ownerEmployeeId",
      "fullName username"
    );

    res.json(accounts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ EMPLOYEE / ADMIN — INLINE UPDATE
exports.updateBhwAccount = async (req, res) => {
  try {
    const updated = await BhwAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ TOGGLE STATUS
// controllers/bhwAccountController.js
exports.toggleBhwStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["working", "suspicious", "not_working"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const acc = await BhwAccount.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    res.json(acc);
  } catch {
    res.status(500).json({ message: "Status update failed" });
  }
};

// ✅ DELETE
exports.deleteBhwAccount = async (req, res) => {
  try {
    await BhwAccount.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

// ✅ ADMIN — CSV EXPORT
exports.exportBhwCSV = async (req, res) => {
  try {
    const accounts = await BhwAccount.find().populate(
      "ownerEmployeeId",
      "fullName",
    );

    const csv = parse(accounts);

    res.header("Content-Type", "text/csv");
    res.attachment("bhw_accounts.csv");
    res.send(csv);
  } catch {
    res.status(500).json({ message: "CSV export failed" });
  }
};
