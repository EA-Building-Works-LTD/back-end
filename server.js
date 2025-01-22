require("dotenv").config(); // Must be included at the top of server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { google } = require("googleapis"); // Google APIs package

// Import Middleware for Authentication and Authorization
const {
  authenticateToken,
  authorizeRole,
} = require("./middleware/authMiddleware");

// Initialize Express
const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json()); // Parse JSON request bodies

mongoose.connect(process.env.MONGODB_URI);

// Import and use API routes
const authRoutes = require("./routes/auth"); // Routes for authentication
const leadsRoutes = require("./routes/leads"); // Routes for leads
const buildersRoutes = require("./routes/builders"); // Routes for builders

// Public Routes
app.use("/api", authRoutes); // Authentication routes (login, register, etc.)

// Protected Routes
app.use("/api/leads", authenticateToken, authorizeRole("admin"), leadsRoutes); // Only admins can access leads
app.use(
  "/api/builders",
  authenticateToken,
  authorizeRole("builder"),
  buildersRoutes
);

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

app.get("/api/google-leads", async (req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString(
          "utf8"
        )
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Form Responses 1!A2:L",
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No data found in the sheet" });
    }

    const leads = rows.map((row) => ({
      timestamp: row[0] || "N/A",
      builder: row[1] || "N/A",
      fullName: row[2] || "N/A",
      phoneNumber: row[3] || "N/A",
      address: row[4] || "N/A",
      workRequired: row[5] || "N/A",
      details: row[6] || "N/A",
      budget: row[7] || "N/A",
      city: row[8] || "N/A",
      startDate: row[9] || "N/A",
      email: row[10] || "N/A",
      contactPreference: row[11] || "N/A",
    }));

    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Google Sheet data" });
  }
});

// Listen on a port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const API_BASE_URL = "https://back-end-4lrs.onrender.com/";
