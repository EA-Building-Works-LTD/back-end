require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { google } = require("googleapis");

const authRoutes = require("./routes/auth"); // <-- Adjust if your 'auth' route is elsewhere
const {
  authenticateToken,
  authorizeRole,
} = require("./middleware/authMiddleware");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",                 // Local dev
      "https://front-end-sage-two.vercel.app", // Your production domain
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ============== OPTIONAL: MONGODB ==============
mongoose
  .connect(
    "mongodb+srv://gabuildersltd24:Ehsaan123123@cluster0.ttcdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    console.error("Connection string:", process.env.MONGODB_URI);
    process.exit(1); // Exit if connection fails
  });

// Mount auth routes
app.use("/api", authRoutes);

// ============== GOOGLE SHEETS EXAMPLE ROUTES ==============
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// GET => returns ephemeral _id for each row
app.get("/api/google-leads", async (req, res) => {
  try {
    console.log("GET /api/google-leads called");

    // Auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString(
          "utf8"
        )
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Read rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Form Responses 1!A2:L", // Adjust if your sheet is different
    });
    const rows = response.data.values || [];

    if (rows.length === 0) {
      return res.status(404).json({ message: "No data found in the sheet" });
    }

    // Add ephemeral _id
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

    console.log("Returning leads (first 3 sample):", leads.slice(0, 3));
    res.json(leads);
  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    res.status(500).json({ message: "Error fetching Google Sheet data" });
  }
});

// PUT => updates builder in column B
app.put("/api/google-leads/:id", async (req, res) => {
  try {
    console.log("PUT /api/google-leads =>", req.params.id, req.body);

    const { id } = req.params;
    if (!id.startsWith("googleSheet-")) {
      return res.status(400).json({ message: "Invalid ID format." });
    }
    const rowIndex = parseInt(id.replace("googleSheet-", ""), 10);
    if (isNaN(rowIndex)) {
      return res.status(400).json({ message: "Unable to parse row index" });
    }

    // rowIndex=0 => actual row=2 if your range starts at row 2
    const sheetRow = rowIndex + 2;
    const { builder } = req.body;

    // Auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString(
          "utf8"
        )
      ),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // If builder is in column B => "Form Responses 1!B<row>"
    const range = `Form Responses 1!B${sheetRow}`;
    const updateResp = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[builder]],
      },
    });

    console.log("Update result =>", updateResp.data);
    res.json({
      message: `Builder updated in row #${sheetRow}`,
      update: builder,
      rowIndex,
    });
  } catch (error) {
    console.error("Error updating builder:", error);
    res.status(500).json({ message: "Error updating builder" });
  }
});

// Simple pings
app.get("/ping", (req, res) => res.send("pong"));
app.get("/", (req, res) => res.send("Server is running."));

// Mount the builders routes at /api/builders
const buildersRoutes = require("./routes/builders");
app.use("/api/builders", buildersRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
