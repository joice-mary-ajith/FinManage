require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/categoryModel");

const defaults = [
  ...["Groceries", "Rent", "Transport", "Utilities", "Dining Out", "Health", "Entertainment", "Shopping"]
    .map((name) => ({ name, type: "expense", userId: null })),
  ...["Salary", "Other Income"].map((name) => ({ name, type: "income", userId: null })),
];

// Safe to run more than once: a default category that already exists is left untouched,
// so its _id (used by existing transactions and budgets) never changes. Only missing ones are added.
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Category.bulkWrite(
    defaults.map((c) => ({
      updateOne: { filter: { userId: null, name: c.name, type: c.type }, update: { $setOnInsert: c }, upsert: true },
    }))
  );
  console.log(`Default categories ready (${result.upsertedCount} added, ${defaults.length - result.upsertedCount} already existed)`);
  process.exit(0);
})();