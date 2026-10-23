
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

const Report = mongoose.model("Report", reportSchema);

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

async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Atlas connected successfully!");

        app.listen(PORT, () => {
            console.log(`CivicShield running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Startup error:", error.message);
        process.exit(1);
    }
}

startServer();
