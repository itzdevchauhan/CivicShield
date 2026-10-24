
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const reportSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        location: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Resolved"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

const Report = mongoose.models.Report ||
    mongoose.model("Report", reportSchema);

// Connect to MongoDB before handling requests.
app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            if (!process.env.MONGODB_URI) {
                throw new Error("MONGODB_URI is missing");
            }

            await mongoose.connect(process.env.MONGODB_URI);
            console.log("MongoDB Atlas connected successfully!");
        }

        next();
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        res.status(500).json({
            message: "Database connection failed. Please try again."
        });
    }
});

app.get("/api/status", (req, res) => {
    res.json({
        project: "CivicShield",
        status: mongoose.connection.readyState === 1
            ? "MongoDB Connected"
            : "MongoDB Disconnected"
    });
});

app.get("/api/reports", async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        console.error("Load reports error:", error.message);
        res.status(500).json({ message: "Could not load reports." });
    }
});

app.post("/api/reports", async (req, res) => {
    try {
        const { title, category, location, description } = req.body;

        if (
            ![title, category, location, description].every(
                value => typeof value === "string" && value.trim()
            )
        ) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        const report = await Report.create({
            title: title.trim(),
            category: category.trim(),
            location: location.trim(),
            description: description.trim()
        });

        res.status(201).json({
            message: "Report saved successfully!",
            report
        });
    } catch (error) {
        console.error("Report save error:", error.message);
        res.status(500).json({ message: "Could not save report." });
    }
});

// Export the Express app for Vercel.
module.exports = app;

// Start a regular server when running locally.
if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`CivicShield running at http://localhost:${PORT}`);
    });
}
