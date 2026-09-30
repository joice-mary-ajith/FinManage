const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["income", "expense"], required: true },
});

module.exports = mongoose.model("Category", categorySchema);