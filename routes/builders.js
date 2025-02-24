// routes/builders.js
const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const { google } = require("googleapis");

// A simple public endpoint to confirm the router works
router.get("/test-public", (req, res) => {
  res.send("Public route is working!");
});

// Example GET: /api/builders/jobs (requires token + 'builder' role)
router.get("/jobs", authenticateToken, authorizeRole("builder"), async (req, res) => {
  try {
    const builderName = req.user.username;
    console.log("Builder name from token:", builderName);
    if (!builderName) {
      return res.status(403).json({ message: "Access denied: No builder name in token" });
    }
    // If you had a "Lead" model in Mongo, you could query. Return empty array for now:
    res.json([]);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/builders/my-leads (requires token + 'builder' role)
router.get("/my-leads", authenticateToken, authorizeRole("builder"), async (req, res) => {
  try {
    // Google Sheets API auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    
    // Fetch leads from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Form Responses 1!A2:L",
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.status(404).json({ message: "No data found in the sheet" });
    }
    
    // Map rows to lead objects
    const leads = rows.map((row, index) => ({
      _id: `googleSheet-${index}`,
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
      status: "N/A",
    }));
    
    // Filter leads by builder == logged-in user (case-insensitive)
    const myLeads = leads.filter(
      (lead) =>
        lead.builder.trim().toLowerCase() === req.user.username.trim().toLowerCase()
    );
    
    res.json(myLeads);
  } catch (error) {
    console.error("Error fetching My Leads:", error);
    res.status(500).json({ message: "Error fetching My Leads" });
  }
});

module.exports = router;
