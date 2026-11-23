import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        // ── Basic Identity ─────────────────────────────────────────
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        // Password — null for Google OAuth users (they don't need one)
        password: {
            type: String,
            default: null,
            select: false, // never returned in queries unless explicitly asked
        },

        avatar: {
            type: String,
            default: "",
        },

        // ── OAuth ──────────────────────────────────────────────────
        // Google OAuth sub (unique Google user ID)
        googleId: {
            type: String,
            default: null,
            sparse: true, // allows multiple null values in the unique index
            unique: true,
        },

        // ── Store Connections ──────────────────────────────────────
        // Epic Games Store profile ID, linked after login
        epicStoreId: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Account Metadata ───────────────────────────────────────
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        // Wishlist — array of externalIds from the Game collection
        wishlist: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// ── Hash password before saving ────────────────────────────────────────────
userSchema.pre("save", async function (next) {
    // Only hash if password was set/changed, and it isn't already a hash
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ── Instance method: compare plaintext password with stored hash ───────────
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// ── Safe public projection (strip sensitive fields) ───────────────────────
userSchema.methods.toPublic = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
