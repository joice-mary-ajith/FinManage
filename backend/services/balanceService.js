const mongoose = require("mongoose");
const Transaction = require("../models/transactionModel");

// balance = openingBalance + sum(income) - sum(expense), computed on every read (FR-2.2)
exports.attachBalances = async (userId, accounts) => {
  const totals = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: { accountId: "$accountId", type: "$type" }, total: { $sum: "$amount" } } },
  ]);

  return accounts.map((acc) => {
    const sum = (type) =>
      totals.find((t) => String(t._id.accountId) === String(acc._id) && t._id.type === type)?.total || 0;
    return { ...acc.toObject(), balance: acc.openingBalance + sum("income") - sum("expense") };
  });
};