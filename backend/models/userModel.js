const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Controls what the user is allowed to do
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    // Admin can deactivate a user
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Password reset OTP
    resetPasswordOtpHash: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },

    resetPasswordOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);