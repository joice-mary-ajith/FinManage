const mongoose = require("mongoose");
const Transaction = require("../models/transactionModel");

const uid = (id) => new mongoose.Types.ObjectId(id);

// Default period = current month. "to" is stretched to the end of that day.
const dateRange = (from, to) => {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to ? new Date(to) : now;
  if (to) end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

// FR-4.1: total income, total expense, net savings
exports.getSummary = async (userId, from, to) => {
  const rows = await Transaction.aggregate([
    { $match: { userId: uid(userId), date: dateRange(from, to) } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const total = (t) => rows.find((r) => r._id === t)?.total || 0;
  const income = total("income");
  const expense = total("expense");
  return { income, expense, netSavings: income - expense };
};

// FR-4.2: expense total per category
exports.getCategoryBreakdown = async (userId, from, to) =>
  Transaction.aggregate([
    { $match: { userId: uid(userId), type: "expense", date: dateRange(from, to) } },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $project: { _id: 0, categoryId: "$_id", name: "$category.name", total: 1 } },
    { $sort: { total: -1 } },
  ]);

// FR-4.3: income vs expense per month for the last N months
exports.getTrend = async (userId, months = 6) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await Transaction.aggregate([
    { $match: { userId: uid(userId), date: { $gte: start } } },
    {
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  // include months with no transactions as zeros, so the chart has no gaps
  const result = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const get = (type) => rows.find((r) => r._id.month === key && r._id.type === type)?.total || 0;
    result.push({ month: key, income: get("income"), expense: get("expense") });
  }
  return result;
};