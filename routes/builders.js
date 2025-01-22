const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

// Mock data for builders
const builders = [
  { id: 1, name: "Builder One", speciality: "Loft Conversions" },
  { id: 2, name: "Builder Two", speciality: "Bathroom Renovations" },
];

// Get all builders (protected route)
router.get("/", authenticateToken, authorizeRole("builder"), (req, res) => {
  res.json(builders);
});

// Add more routes for builders as needed

module.exports = router;
