import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
    {
        // Epic's internal unique ID for this offer
        epicId: {
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

        // Best available cover image from Epic's keyImages array
        image: {
            type: String,
            default: "",
        },

        // Prices are stored in cents (as Epic returns them)
        originalPrice: {
            type: Number,
            default: 0,
        },

        discountPrice: {
            type: Number,
            default: 0,
        },

        // Human-readable formatted price e.g. "$59.99"
        formattedOriginalPrice: {
            type: String,
            default: "Free",
        },

        // Direct link to the Epic Games store page
        storeUrl: {
            type: String,
            default: "",
        },

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
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

// Index for fast search and sorting
gameSchema.index({ title: "text", description: "text" });
gameSchema.index({ promotionEnd: 1 });
gameSchema.index({ isFree: 1 });

const Game = mongoose.model("Game", gameSchema);

export default Game;
