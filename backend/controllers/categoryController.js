const Category = require("../models/categoryModel");

exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find({ $or: [{ userId: null }, { userId: req.user._id }] });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !["income", "expense"].includes(type))
      return res.status(400).json({ message: "Valid name and type required" });
    const cat = await Category.create({ userId: req.user._id, name, type });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};