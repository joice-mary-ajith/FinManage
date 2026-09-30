const mongoose = require("mongoose");
const Account = require("../models/accountModel");
const Transaction = require("../models/transactionModel");
const { attachBalances } = require("../services/balanceService");

const TYPES = ["cash", "bank", "credit_card", "savings"];

exports.createAccount = async (req, res) => {
  try {
    const { name, type, openingBalance } = req.body;
    if (!name || !TYPES.includes(type)) return res.status(400).json({ message: "Valid name and type required" });
    const ob = openingBalance === undefined ? 0 : Number(openingBalance);
    if (Number.isNaN(ob)) return res.status(400).json({ message: "Opening balance must be a number" });

    const account = await Account.create({ userId: req.user._id, name, type, openingBalance: ob });
    const [withBalance] = await attachBalances(req.user._id, [account]);
    res.status(201).json(withBalance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.json(await attachBalances(req.user._id, accounts));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const { name, type } = req.body;
    if (type && !TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...(name && { name }), ...(type && { type }) },
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ message: "Account not found" });
    const [withBalance] = await attachBalances(req.user._id, [account]);
    res.json(withBalance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
    if (!account) return res.status(404).json({ message: "Account not found" });

    if (await Transaction.exists({ accountId: account._id }))
      return res.status(409).json({ message: "Cannot delete an account that has transactions" });

    await account.deleteOne();
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};