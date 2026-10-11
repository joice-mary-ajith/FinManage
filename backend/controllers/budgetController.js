const mongoose = require("mongoose");
const Budget = require("../models/budgetModel");
const Category = require("../models/categoryModel");
const { listBudgets } = require("../services/budgetService");

// GET /budgets -> [{ _id, categoryId, categoryName, amount, spent }]  (spent = this month only)
exports.getBudgets = async (req, res) => {
  try {
    res.json(await listBudgets(req.user._id));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /budgets  { categoryId, amount } -> creates the budget, or updates it if the category already has one
exports.saveBudget = async (req, res) => {
  try {
    const { categoryId, amount } = req.body;
    if (!mongoose.isValidObjectId(categoryId)) return res.status(400).json({ message: "Valid categoryId required" });
    if (!(Number(amount) >= 1)) return res.status(400).json({ message: "Budget must be at least 1" });

    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ userId: null }, { userId: req.user._id }],
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.type !== "expense") return res.status(400).json({ message: "Budgets only apply to expense categories" });

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, categoryId },
      { amount: Number(amount) },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /budgets/:id
exports.deleteBudget = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    res.json({ message: "Budget deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};