import gamesRouter from "./src/routes/games.js";
import connectDB from "./src/db.js";
import { syncEpicGames, startSyncJob } from "./src/jobs/sync.js";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend client
app.use(express.static(path.join(__dirname, "../client")));

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "server is running",
    });
});

app.use("/api/games", gamesRouter);

// Fallback: serve index.html for any non-API route
app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ── START: Connect DB → run first sync → start cron → listen ──────────────
const start = async () => {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Run an immediate sync on boot so games are ready right away
    await syncEpicGames();

    // 3. Schedule the cron job for hourly syncs
    startSyncJob();

    // 4. Start the HTTP server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`\n🚀 Server running at http://localhost:${port}`);
        console.log(`🎮 FreeDrop UI  → http://localhost:${port}`);
        console.log(`🔌 API          → http://localhost:${port}/api/games`);
    });
};

start();