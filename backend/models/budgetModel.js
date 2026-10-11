const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

// Only the LIMIT is stored. "Spent" is never saved: it is calculated from this month's
// expenses every time, which is why it resets itself on the 1st while the limit stays.
const budgetSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    categoryId: { type: ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true, min: 1 }, // monthly limit
  },
  { timestamps: true }
);

// one budget per user per category
budgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);