const mongoose = require("mongoose");
const Budget = require("../models/budgetModel");
const Transaction = require("../models/transactionModel");

const oid = (id) => new mongoose.Types.ObjectId(id);
const round2 = (n) => Math.round(n * 100) / 100; // avoids 5000.0000000001 > 5000 surprises with decimals

// The current calendar month as [start, end). Done in UTC because the app stores a
// transaction's date as UTC midnight of the day the user picked.
// Next month this range moves forward by itself, so last month's expenses stop counting.
const currentMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
};

// { "<categoryId>": totalSpent } counting ONLY this month's expenses
const spentThisMonth = async (userId, categoryIds) => {
  const { start, end } = currentMonthRange();
  const match = { userId: oid(userId), type: "expense", date: { $gte: start, $lt: end } };
  if (categoryIds) match.categoryId = { $in: categoryIds.map(oid) };

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), round2(r.total)]));
};

// All of a user's budgets, each with this month's spending attached.
exports.listBudgets = async (userId) => {
  const budgets = await Budget.find({ userId }).populate("categoryId", "name").sort({ createdAt: 1 });
  const spent = await spentThisMonth(userId);

  return budgets
    .filter((b) => b.categoryId) // skip budgets whose category was deleted
    .map((b) => ({
      _id: b._id,
      categoryId: b.categoryId._id,
      categoryName: b.categoryId.name,
      amount: b.amount,
      spent: spent[String(b.categoryId._id)] || 0,
    }));
};

// Call right after an expense is saved. Returns { categoryName, spent, amount } if that
// category is now over its monthly budget, otherwise null.
// It never throws: a failure here must not turn an already-saved transaction into an error.
exports.checkBudget = async (txn) => {
  try {
    if (txn.type !== "expense") return null;

    // only expenses dated this month can push this month over
    const { start, end } = currentMonthRange();
    if (txn.date < start || txn.date >= end) return null;

    const budget = await Budget.findOne({ userId: txn.userId, categoryId: txn.categoryId }).populate("categoryId", "name");
    if (!budget || !budget.categoryId) return null;

    const spent = (await spentThisMonth(txn.userId, [txn.categoryId]))[String(txn.categoryId)] || 0;
    if (spent <= budget.amount) return null;

    return { categoryName: budget.categoryId.name, spent, amount: budget.amount };
  } catch (err) {
    console.error("Budget check failed:", err.message);
    return null;
  }
};