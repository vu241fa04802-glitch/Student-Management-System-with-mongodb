const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

const dataSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    students: { type: [mongoose.Schema.Types.Mixed], default: [] },
    attendance: { type: [mongoose.Schema.Types.Mixed], default: [] },
    marks: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true });

const AppData = mongoose.model("AppData", dataSchema);

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

app.get("/api/data", async (req, res) => {
    try {
        const data = await AppData.findOne({ key: "student-management-system" }).lean();
        res.json({
            students: data?.students || [],
            attendance: data?.attendance || [],
            marks: data?.marks || []
        });
    } catch (error) {
        console.error("Read error:", error);
        res.status(500).json({ message: "Unable to load student data." });
    }
});

app.put("/api/data", async (req, res) => {
    try {
        const { students, attendance, marks } = req.body;

        if (!Array.isArray(students) || !Array.isArray(attendance) || !Array.isArray(marks)) {
            return res.status(400).json({ message: "Students, attendance and marks must be arrays." });
        }

        const saved = await AppData.findOneAndUpdate(
            { key: "student-management-system" },
            { $set: { students, attendance, marks } },
            { new: true, upsert: true, runValidators: true }
        );

        res.json({
            message: "Data saved successfully.",
            counts: {
                students: saved.students.length,
                attendance: saved.attendance.length,
                marks: saved.marks.length
            }
        });
    } catch (error) {
        console.error("Save error:", error);
        res.status(500).json({ message: "Unable to save student data." });
    }
});

// Serve the existing HTML, CSS and JavaScript frontend.
app.use(express.static(path.join(__dirname, "public")));

async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing. Add it to your .env file.");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Student Management System running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
