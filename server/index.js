import 'dotenv/config';

import gamesRouter from "./src/routes/games.js";
import authRouter  from "./src/routes/auth.js";
import connectDB   from "./src/db.js";
import { syncAllGames, startSyncJob } from "./src/jobs/sync.js";
import dotenv    from "dotenv";
import express   from "express";
import cors      from "cors";
import passport  from "passport";
import path      from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(passport.initialize()); // stateless — no sessions (we use JWT)

// Serve the frontend client
app.use(express.static(path.join(__dirname, "../client")));

// ── API Routes ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "server is running" });
});

app.use("/api/auth",  authRouter);
app.use("/api/games", gamesRouter);

// ── SPA Fallback ──────────────────────────────────────────────────────────
app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ── Startup ───────────────────────────────────────────────────────────────
const start = async () => {
    await connectDB();
    await syncAllGames();
    startSyncJob();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`\n🚀 Server  → http://localhost:${port}`);
        console.log(`🎮 UI      → http://localhost:${port}`);
        console.log(`🔌 API     → http://localhost:${port}/api/games`);
        console.log(`🔐 Auth    → http://localhost:${port}/api/auth`);
    });
};

start();
