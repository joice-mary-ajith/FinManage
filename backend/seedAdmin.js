require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/userModel");

const createAdmin = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    const email =
      process.env.ADMIN_EMAIL.toLowerCase();

    const password =
      process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
      );
    }

    const existing =
      await User.findOne({ email });

    if (existing) {
      console.log(
        "Admin email already exists."
      );

      process.exit(0);
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    await User.create({
      name: "FinManage Admin",
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log(
      "Admin account created successfully."
    );

    process.exit(0);
  } catch (err) {
    console.error(
      "Failed to create admin:",
      err
    );

    process.exit(1);
  }
};

createAdmin();