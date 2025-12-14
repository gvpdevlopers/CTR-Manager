const PlatformAccount = require("../models/PlatformAccount");

// ✅ EMPLOYEE: Add new platform account
exports.addPlatformAccount = async (req, res) => {
  try {
    const {
      platform,
      username,
      profileLink,
      devPlatformPasswordEncrypted,
      status,
    } = req.body;

    const account = await PlatformAccount.create({
      ownerUserId: req.user._id, // employee
      platform,
      username,
      profileLink,
      devPlatformPasswordEncrypted:
        process.env.APP_ENV === "development"
          ? devPlatformPasswordEncrypted
          : null,
      status: status || "active",
    });

    res.status(201).json({
      message: "Platform account added successfully",
      account,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add platform account" });
  }
};

// ✅ EMPLOYEE: Get own platform accounts
exports.getMyPlatformAccounts = async (req, res) => {
  try {
    const accounts = await PlatformAccount.find({
      ownerUserId: req.user._id,
    });

    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

// ✅ EMPLOYEE: Update own platform account
exports.updateMyPlatformAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await PlatformAccount.findOne({
      _id: id,
      ownerUserId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const { username, profileLink, status, devPlatformPasswordEncrypted } =
      req.body;

    if (username) account.username = username;
    if (profileLink) account.profileLink = profileLink;
    if (status) account.status = status;

    if (process.env.APP_ENV === "development" && devPlatformPasswordEncrypted) {
      account.devPlatformPasswordEncrypted = devPlatformPasswordEncrypted;
    }

    await account.save();

    res.json({ message: "Platform account updated successfully", account });
  } catch (error) {
    res.status(500).json({ message: "Failed to update platform account" });
  }
};

// ✅ EMPLOYEE: Delete own account
exports.deleteMyPlatformAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await PlatformAccount.findOne({
      _id: id,
      ownerUserId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    await account.deleteOne();

    res.json({ message: "Platform account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete platform account" });
  }
};

// ✅ ADMIN: Get ALL platform accounts (all employees)
exports.getAllPlatformAccounts = async (req, res) => {
  try {
    const accounts = await PlatformAccount.find().populate(
      "ownerUserId",
      "fullName username role"
    );

    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all platform accounts" });
  }
};
