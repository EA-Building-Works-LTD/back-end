const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware"); // Ensure this import is correct
const Lead = require("../models/Lead"); // Import the Lead model for job fetching

// Route to get jobs assigned to the logged-in builder
router.get("/jobs", authenticateToken, authorizeRole("builder"), async (req, res) => {
  try {
    const builderName = req.user.username; // Extract builder name from the token payload
    console.log("Builder name from token:", builderName); // Debug log

    if (!builderName) {
      return res.status(403).json({ message: "Access denied: No builder name in token" });
    }

    // Fetch jobs assigned to this builder
    const jobs = await Lead.find({ builder: builderName }); // Adjust field if necessary
    console.log("Jobs for builder:", jobs); // Debug log
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
