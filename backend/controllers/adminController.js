const User = require("../models/userModel");
const Account = require("../models/accountModel");
const Transaction = require("../models/transactionModel");
const Category = require("../models/categoryModel");

// =========================
// APP STATISTICS
// =========================

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, deactivatedUsers, totalAccounts, totalTransactions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Account.countDocuments(),
      Transaction.countDocuments(),
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        deactivated: deactivatedUsers,
      },
      accounts: totalAccounts,
      transactions: totalTransactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// VIEW USERS
// =========================

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id name email role isActive createdAt")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// DEACTIVATE USER
// =========================

exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow an admin to deactivate themselves.
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot deactivate your own admin account",
      });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: "User deactivated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// ACTIVATE USER
// =========================

exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: "User activated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// DEFAULT CATEGORIES
// =========================

exports.getDefaultCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: null }).sort({
      type: 1,
      name: 1,
    });

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// ADD DEFAULT CATEGORY
// =========================

exports.addDefaultCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Valid name and type required" });
    }

    const existing = await Category.findOne({
      userId: null,
      name: name.trim(),
      type,
    });

    if (existing) {
      return res.status(409).json({ message: "Default category already exists" });
    }

    const category = await Category.create({
      userId: null,
      name: name.trim(),
      type,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// RENAME DEFAULT CATEGORY
// =========================

exports.updateDefaultCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name required" });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      userId: null,
    });

    if (!category) {
      return res.status(404).json({ message: "Default category not found" });
    }

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Invalid category type" });
    }

    const newType = type || category.type;

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      userId: null,
      name: name.trim(),
      type: newType,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Another default category with this name already exists",
      });
    }

    category.name = name.trim();
    category.type = newType;

    await category.save();

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// DELETE DEFAULT CATEGORY
// =========================

exports.deleteDefaultCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: null,
    });

    if (!category) {
      return res.status(404).json({ message: "Default category not found" });
    }

    const Transaction = require("../models/transactionModel");

    const used = await Transaction.exists({
      categoryId: category._id,
    });

    if (used) {
      return res.status(409).json({
        message: "Cannot delete a category that is already used by transactions",
      });
    }

    await category.deleteOne();

    res.json({ message: "Default category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};