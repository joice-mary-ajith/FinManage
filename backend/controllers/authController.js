const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/userModel");
const { sendPasswordResetOtp } = require("../services/emailService");

const emailOk = (e) =>
  /^\S+@\S+\.\S+$/.test(e);

const passwordOk = (p) =>
  typeof p === "string" &&
  p.length >= 8 &&
  /[A-Za-z]/.test(p) &&
  /\d/.test(p);

const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );

// REGISTER

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !emailOk(email)) {
      return res.status(400).json({
        message: "Valid name and email required",
      });
    }

    if (!passwordOk(password)) {
      return res.status(400).json({
        message:
          "Password needs 8+ characters with a letter and a number",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "user",
      isActive: true,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// LOGIN

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      token: signToken(user._id),

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// CURRENT USER

exports.getMe = (req, res) => {
  const {
    _id,
    name,
    email,
    role,
    isActive,
  } = req.user;

  res.json({
    id: _id,
    name,
    email,
    role,
    isActive,
  });
};

// FORGOT PASSWORD - SEND OTP

exports.forgotPassword = async (req, res) => {
  try {
    const email =
      (req.body.email || "").toLowerCase();

    if (!emailOk(email)) {
      return res.status(400).json({
        message: "Valid email required",
      });
    }

    const user = await User.findOne({
      email,
    });

    // Don't reveal whether an email exists.
    const genericMessage =
      "If that email exists, a password reset OTP has been sent.";

    if (!user) {
      return res.json({
        message: genericMessage,
      });
    }

    // Generate a 6-digit OTP.
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Store a hash of the OTP, NOT the actual OTP.
    const otpHash = await bcrypt.hash(
      otp,
      10
    );

    user.resetPasswordOtpHash = otpHash;

    // OTP valid for 10 minutes.
    user.resetPasswordOtpExpires =
      new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtpAttempts = 0;

    await user.save();

    await sendPasswordResetOtp(
      user.email,
      otp
    );

    res.json({
      message: genericMessage,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to send reset OTP",
    });
  }
};


// =========================
// RESET PASSWORD - VERIFY OTP
// =========================

exports.resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
    } = req.body;

    if (
      !email ||
      !otp ||
      !passwordOk(newPassword)
    ) {
      return res.status(400).json({
        message:
          "Email, OTP and valid new password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select(
      "+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts +passwordHash"
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    if (
      !user.resetPasswordOtpHash ||
      !user.resetPasswordOtpExpires
    ) {
      return res.status(400).json({
        message: "No password reset request found",
      });
    }

    if (
      user.resetPasswordOtpExpires.getTime() <
      Date.now()
    ) {
      user.resetPasswordOtpHash = null;
      user.resetPasswordOtpExpires = null;
      user.resetPasswordOtpAttempts = 0;

      await user.save();

      return res.status(400).json({
        message: "OTP expired",
      });
    }

    // Limit wrong attempts.
    if (user.resetPasswordOtpAttempts >= 5) {
      return res.status(429).json({
        message:
          "Too many incorrect OTP attempts. Request a new OTP.",
      });
    }

    const validOtp = await bcrypt.compare(
      String(otp),
      user.resetPasswordOtpHash
    );

    if (!validOtp) {
      user.resetPasswordOtpAttempts += 1;

      await user.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Hash the new password with bcrypt.
    user.passwordHash =
      await bcrypt.hash(newPassword, 10);

    // OTP becomes unusable after successful reset.
    user.resetPasswordOtpHash = null;
    user.resetPasswordOtpExpires = null;
    user.resetPasswordOtpAttempts = 0;

    await user.save();

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};