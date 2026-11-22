import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
    {
        // ── OLD (Epic-only unique key) — commented out, replaced by externalId ──
        // epicId: {
        //     type: String,
        //     required: true,
        //     unique: true,
        // },

        // Generic unique key across all sources: "epic_<id>", "gamerpower_<id>", etc.
        externalId: {
            type: String,
            required: true,
            unique: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        // Cover image URL
        image: {
            type: String,
            default: "",
        },

        // Prices in cents (Epic) or 0 (already free from GamerPower)
        originalPrice: {
            type: Number,
            default: 0,
        },

        discountPrice: {
            type: Number,
            default: 0,
        },

        // Human-readable price string e.g. "$59.99" or "Free"
        formattedOriginalPrice: {
            type: String,
            default: "Free",
        },

        // Direct store link
        storeUrl: {
            type: String,
            default: "",
        },

        // Which store this came from: "Epic Games", "Steam", "GOG", "itch.io", etc.
        source: {
            type: String,
            default: "Epic Games",
        },

        platform: {
            type: String,
            default: "PC",
        },

        // Active promotion window
        promotionStart: {
            type: Date,
            default: null,
        },

        promotionEnd: {
            type: Date,
            default: null,
        },

        isFree: {
            type: Boolean,
            default: true,
        },

        // When we last fetched and saved this game
        fetchedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for fast lookup
gameSchema.index({ title: "text", description: "text" });
gameSchema.index({ promotionEnd: 1 });
gameSchema.index({ isFree: 1 });
gameSchema.index({ source: 1 });

const Game = mongoose.model("Game", gameSchema);

export default Game;
