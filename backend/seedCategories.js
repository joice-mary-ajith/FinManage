require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/categoryModel");

const defaults = [
  ...["Groceries", "Rent", "Transport", "Utilities", "Dining Out", "Health", "Entertainment", "Shopping"]
    .map((name) => ({ name, type: "expense", userId: null })),
  ...["Salary", "Other Income"].map((name) => ({ name, type: "income", userId: null })),
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Category.deleteMany({ userId: null });
  await Category.insertMany(defaults);
  console.log("Seeded default categories");
  process.exit(0);
})();