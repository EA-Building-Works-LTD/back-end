require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();

// Change this if your front-end is deployed elsewhere
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://YOUR-FRONTEND-APP.vercel.app", 
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Simple ping
app.get("/ping", (req, res) => {
  res.send("pong");
});

// GET => returns ephemeral _id for each row from Google Sheets
app.get("/api/google-leads", async (req, res) => {
  try {
    console.log("GET /api/google-leads called");

    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    if (!SPREADSHEET_ID) {
      return res
        .status(500)
        .json({ message: "SPREADSHEET_ID not set in environment." });
    }

    // Auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Change the range if your sheet is named differently
    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Form Responses 1!A2:L",
    });

    const rows = sheetResponse.data.values || [];
    if (rows.length === 0) {
      return res.status(404).json({ message: "No data found in Google Sheet." });
    }

    // Create ephemeral ID like "googleSheet-0" for each row
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

    console.log("Returning leads (sample) =>", leads.slice(0, 3));
    return res.json(leads);
  } catch (error) {
    console.error("Error in GET /api/google-leads:", error);
    return res.status(500).json({ message: "Server error fetching leads." });
  }
});

// PUT => update builder in the Google Sheet
app.put("/api/google-leads/:id", async (req, res) => {
  try {
    console.log("PUT /api/google-leads => ID:", req.params.id, "Body:", req.body);

    const { id } = req.params; // e.g., "googleSheet-5"
    if (!id.startsWith("googleSheet-")) {
      return res.status(400).json({ message: "Invalid ID format." });
    }
    const rowIndex = parseInt(id.replace("googleSheet-", ""), 10);
    if (isNaN(rowIndex)) {
      return res.status(400).json({ message: "Unable to parse row index." });
    }

    // rowIndex=0 => actual sheet row #2 if data starts on row 2
    const sheetRow = rowIndex + 2;
    const { builder, status } = req.body;

    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    if (!SPREADSHEET_ID) {
      return res
        .status(500)
        .json({ message: "SPREADSHEET_ID not set in environment." });
    }

    // Auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Update "builder" in column B
    // e.g. "Form Responses 1!B5" if rowIndex=3 => sheetRow=5
    const builderRange = `Form Responses 1!B${sheetRow}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: builderRange,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[builder]],
      },
    });

    // If you'd like to store status in the sheet, pick a free column (e.g. column M)
    // const statusRange = `Form Responses 1!M${sheetRow}`;
    // await sheets.spreadsheets.values.update({
    //   spreadsheetId: SPREADSHEET_ID,
    //   range: statusRange,
    //   valueInputOption: "USER_ENTERED",
    //   resource: {
    //     values: [[status]],
    //   },
    // });

    console.log(`Updated row #${sheetRow} => builder=${builder}, status=${status}`);
    return res.json({
      message: `Updated row #${sheetRow}`,
      rowIndex,
      builder,
      status,
    });
  } catch (error) {
    console.error("Error in PUT /api/google-leads:", error);
    return res
      .status(500)
      .json({ message: "Server error updating lead in Google Sheet." });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
