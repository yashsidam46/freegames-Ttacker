import cron from "node-cron";
import { fetchEpicGames } from "../fetchers/epic.js";
import Game from "../models/Game.js";

// ─── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Pick the best available cover image from Epic's keyImages array.
 * Priority: Thumbnail > DieselStoreFrontWide > OfferImageWide > first available
 */
const pickImage = (keyImages = []) => {
    const priority = [
        "Thumbnail",
        "DieselStoreFrontWide",
        "OfferImageWide",
        "DieselGameBoxWide",
        "OfferImageTall",
    ];

    for (const type of priority) {
        const found = keyImages.find((img) => img.type === type);
        if (found?.url) return found.url;
    }

    // Fallback: just grab whatever is first
    return keyImages?.[0]?.url || "";
};

/**
 * Build the Epic Games store URL from the offer object.
 * Uses productSlug or the catalog namespace page slug.
 */
const buildStoreUrl = (offer) => {
    const slug =
        offer.productSlug ||
        offer.catalogNs?.mappings?.[0]?.pageSlug ||
        "";

    if (!slug) return "https://store.epicgames.com/en-US/free-games";
    return `https://store.epicgames.com/en-US/p/${slug}`;
};

// ─── CORE SYNC FUNCTION ────────────────────────────────────────────────────

export const syncEpicGames = async () => {
    console.log("🔄 [Sync] Starting Epic Games sync…");

    try {
        // 1. Fetch raw data from Epic API
        const data = await fetchEpicGames();
        const offers = data?.data?.Catalog?.searchStore?.elements || [];

        console.log(`📦 [Sync] Total offers fetched from Epic: ${offers.length}`);

        // 2. Apply YOUR filter logic (from test.js):
        //    - discountPrice must be 0  (game is free)
        //    - promotionalOffers must have active entries (promotion is live right now)
        const activeFreeGames = offers.filter((offer) => {
            const isPriceZero = offer.price?.totalPrice?.discountPrice === 0;
            const hasActivePromo = offer.promotions?.promotionalOffers?.length > 0;

            return isPriceZero && hasActivePromo;
        });

        console.log(`🎮 [Sync] Active free games found: ${activeFreeGames.length}`);

        if (activeFreeGames.length === 0) {
            console.log("ℹ️  [Sync] No active free games right now. DB not modified.");
            return;
        }

        // 3. Map each filtered offer to our Game schema shape
        const upsertOps = activeFreeGames.map((offer) => {
            const activePromo =
                offer.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0];

            const gameData = {
                epicId:               offer.id,
                title:                offer.title,
                description:          offer.description || "",
                image:                pickImage(offer.keyImages),
                originalPrice:        offer.price?.totalPrice?.originalPrice ?? 0,
                discountPrice:        offer.price?.totalPrice?.discountPrice ?? 0,
                formattedOriginalPrice:
                    offer.price?.totalPrice?.fmtPrice?.originalPrice || "Free",
                storeUrl:             buildStoreUrl(offer),
                source:               "Epic Games",
                platform:             "PC",
                promotionStart:       activePromo?.startDate
                    ? new Date(activePromo.startDate)
                    : null,
                promotionEnd:         activePromo?.endDate
                    ? new Date(activePromo.endDate)
                    : null,
                isFree:               true,
                fetchedAt:            new Date(),
            };

            return {
                updateOne: {
                    filter: { epicId: offer.id },     // match by Epic's unique ID
                    update: { $set: gameData },        // update all fields
                    upsert: true,                      // insert if doesn't exist
                },
            };
        });

        // 4. Bulk upsert into MongoDB
        const result = await Game.bulkWrite(upsertOps);

        console.log(
            `✅ [Sync] Done. Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`
        );
    } catch (error) {
        console.error("❌ [Sync] Failed:", error.message);
    }
};

// ─── CRON SCHEDULE ─────────────────────────────────────────────────────────

/**
 * Run sync every hour at minute 0.
 * Epic free games typically refresh weekly on Thursdays,
 * but we poll hourly to catch any changes quickly.
 */
export const startSyncJob = () => {
    console.log("⏰ [Sync] Cron job registered — runs every hour.");

    cron.schedule("0 * * * *", async () => {
        console.log(`\n⏰ [Sync] Cron triggered at ${new Date().toISOString()}`);
        await syncEpicGames();
    });
};
