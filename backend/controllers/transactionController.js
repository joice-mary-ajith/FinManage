const mongoose = require("mongoose");
const Transaction = require("../models/transactionModel");
const Account = require("../models/accountModel");
const Category = require("../models/categoryModel");
const { checkBudget } = require("../services/budgetService");

// returns an error message string, or null if the input is fine
const validateInput = async (userId, { amount, type, categoryId, accountId, date }) => {
  if (!(Number(amount) > 0)) return "Amount must be a positive number";
  if (!["income", "expense"].includes(type)) return "Type must be income or expense";
  if (!date || Number.isNaN(new Date(date).getTime())) return "Valid date required";
  if (!mongoose.isValidObjectId(accountId) || !mongoose.isValidObjectId(categoryId))
    return "Valid accountId and categoryId required";

  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) return "Account not found";

  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ userId: null }, { userId }],
  });
  if (!category) return "Category not found";
  if (category.type !== type) return "Category type does not match transaction type";
  return null;
};

exports.createTransaction = async (req, res) => {
  try {
    const error = await validateInput(req.user._id, req.body);
    if (error) return res.status(400).json({ message: error });

    const { amount, type, categoryId, accountId, date, notes } = req.body;
    const txn = await Transaction.create({
      userId: req.user._id, amount: Number(amount), type, categoryId, accountId, date, notes,
    });
    const budgetAlert = await checkBudget(txn); // null unless this expense pushed the category over its monthly budget
    res.status(201).json({ ...txn.toObject(), budgetAlert });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { from, to, categoryId, accountId, type } = req.query;
    const filter = { userId: req.user._id };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    if (categoryId) filter.categoryId = categoryId;
    if (accountId) filter.accountId = accountId;
    if (type) filter.type = type;

    const txns = await Transaction.find(filter)
      .sort({ date: -1 })
      .populate("accountId", "name type")
      .populate("categoryId", "name type");
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const error = await validateInput(req.user._id, req.body);
    if (error) return res.status(400).json({ message: error });

    const { amount, type, categoryId, accountId, date, notes } = req.body;
    const txn = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { amount: Number(amount), type, categoryId, accountId, date, notes },
      { new: true, runValidators: true }
    );
    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    const budgetAlert = await checkBudget(txn);
    res.json({ ...txn.toObject(), budgetAlert });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const txn = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};