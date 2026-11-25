
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

// 1. CORS configuration
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5500")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins
}));

// 2. Parse JSON request bodies
app.use(express.json());

// 3. Welcome route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "IT Support Desk API is running successfully!"
    });
});

// 4. Database health check
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            status: "ok",
            database: "connected"
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        res.status(503).json({
            message: "Database connection unavailable."
        });
    }
});

// 5. Records API routes
app.use("/api/records", require("./routes/records"));

// 6. Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});

// 7. Error handling middleware
app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            message: "Invalid JSON body."
        });
    }

    res.status(500).json({
        message: "An unexpected server error occurred."
    });
});

// 8. Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`IT Support Desk API running on port ${PORT}`);
});
