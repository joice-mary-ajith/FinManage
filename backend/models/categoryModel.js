const mongoose = require("mongoose");

const categorySchema =
  new mongoose.Schema(
    {
      // null = system/default category
      // ObjectId = user-created category
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      type: {
        type: String,
        enum: ["income", "expense"],
        required: true,
      },
    },
    { timestamps: true }
  );

categorySchema.index(
  { userId: 1, name: 1, type: 1 },
  { unique: true }
);

module.exports =
  mongoose.model(
    "Category",
    categorySchema
  );