import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("MONGO_URI is missing from .env");
        }

        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);

        // ── Schema migration: remove any old documents that used the legacy
        //    "epicId" field (before we switched to "externalId").
        //    Without this, bulkWrite upserts silently fail on the unique index.
        const db = conn.connection.db;
        const gamesCol = db.collection("games");

        // Drop the old epicId unique index if it still exists
        try {
            await gamesCol.dropIndex("epicId_1");
            console.log("🧹 Dropped legacy epicId_1 index");
        } catch {
            // Index didn't exist — that's fine
        }

        // Remove any docs that have epicId but no externalId (old schema)
        const deleted = await gamesCol.deleteMany({
            epicId: { $exists: true },
            externalId: { $exists: false },
        });
        if (deleted.deletedCount > 0) {
            console.log(`🧹 Removed ${deleted.deletedCount} legacy epicId document(s) — will be re-fetched`);
        }

    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
