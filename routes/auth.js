const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username }, // Include `username`
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    

    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Error in POST /login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existing = await User.findOne({ username });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User with that username already exists." });
    }

    const newUser = new User({
      username,
      password,
      role: role || "builder",
    });

    await newUser.save();

    return res.json({
      message: "User created successfully",
      user: {
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error in POST /register:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
