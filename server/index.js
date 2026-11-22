import gamesRouter from "./src/routes/games.js"
import mongoose from "mongoose";
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
        message: "server is running"
    });
});

app.use("/api/games", gamesRouter);

// Fallback: serve index.html for any non-API route
app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`🎮 FreeDrop UI  → http://localhost:${port}`);
    console.log(`🔌 API          → http://localhost:${port}/api/games`);
});