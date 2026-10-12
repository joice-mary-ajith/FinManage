const service = require("../services/analyticsService");
const Transaction = require("../models/transactionModel");

const badDate = (v) => v && Number.isNaN(new Date(v).getTime());

exports.summary = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (badDate(from) || badDate(to)) return res.status(400).json({ message: "Invalid date" });
    res.json(await service.getSummary(req.user._id, from, to));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.categoryBreakdown = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (badDate(from) || badDate(to)) return res.status(400).json({ message: "Invalid date" });
    res.json(await service.getCategoryBreakdown(req.user._id, from, to));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.trend = async (req, res) => {
  try {
    const months = Number(req.query.months) || 6;
    if (months < 1 || months > 24) return res.status(400).json({ message: "months must be 1 to 24" });
    res.json(await service.getTrend(req.user._id, months));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// CSV export
exports.exportCsv = async (req, res) => {
  try {
    const txns = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1 })
      .populate("accountId", "name")
      .populate("categoryId", "name");

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = ["date,type,amount,account,category,notes"];
    txns.forEach((t) =>
      lines.push([
        t.date.toISOString().slice(0, 10), t.type, t.amount,
        esc(t.accountId?.name), esc(t.categoryId?.name), esc(t.notes),
      ].join(","))
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};