import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Configure Google OAuth Strategy ───────────────────────────────────────
passport.use(
    new GoogleStrategy(
        {
            clientID:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                          "http://localhost:3000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email  = profile.emails?.[0]?.value;
                const avatar = profile.photos?.[0]?.value || "";
                const name   = profile.displayName || "User";

                // Check if user already exists (by googleId or email)
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Try to find by email (account might exist via local auth)
                    user = await User.findOne({ email });

                    if (user) {
                        // Link Google to existing account
                        user.googleId     = profile.id;
                        user.authProvider = "google";
                        user.avatar       = user.avatar || avatar;
                        await user.save();
                    } else {
                        // Brand new user via Google
                        user = await User.create({
                            name,
                            email,
                            googleId:     profile.id,
                            avatar,
                            authProvider: "google",
                            isVerified:   true, // Google accounts are pre-verified
                        });
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE OAUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Redirect to Google consent screen
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Step 2: Google redirects back here with an auth code
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/?auth=failed" }),
    (req, res) => {
        // Issue our own JWT, then redirect to frontend with it in the URL
        const token = signToken(req.user._id);
        // Frontend reads this token from the URL hash on load
        res.redirect(`/?token=${token}`);
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, epicStoreId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "name, email and password are required",
            });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            epicStoreId: epicStoreId || null,
            authProvider: "local",
        });

        const token = signToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: user.toPublic(),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password are required",
            });
        }

        // Explicitly select password (it's excluded by default via `select: false`)
        const user = await User.findOne({ email }).select("+password");

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = signToken(user._id);

        res.json({
            success: true,
            token,
            user: user.toPublic(),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (require JWT)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/auth/me — get the current logged-in user
router.get("/me", requireAuth, (req, res) => {
    res.json({ success: true, user: req.user.toPublic() });
});

// POST /api/auth/connect-epic — link an Epic Store ID to the account
router.post("/connect-epic", requireAuth, async (req, res) => {
    try {
        const { epicStoreId } = req.body;

        if (!epicStoreId || !epicStoreId.trim()) {
            return res.status(400).json({
                success: false,
                message: "epicStoreId is required",
            });
        }

        req.user.epicStoreId = epicStoreId.trim();
        await req.user.save();

        res.json({
            success: true,
            message: "Epic Store ID connected successfully",
            user: req.user.toPublic(),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/auth/disconnect-epic — remove Epic Store ID from account
router.post("/disconnect-epic", requireAuth, async (req, res) => {
    try {
        req.user.epicStoreId = null;
        await req.user.save();

        res.json({
            success: true,
            message: "Epic Store ID disconnected",
            user: req.user.toPublic(),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
