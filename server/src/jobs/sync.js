import cron from "node-cron";
import { fetchEpicGames } from "../fetchers/epic.js";
import { fetchGamerPowerGames, detectSource } from "../fetchers/gamerpower.js";
import Game from "../models/Game.js";

// ─── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Pick the best available cover image from Epic's keyImages array.
 * Priority: Thumbnail > DieselStoreFrontWide > OfferImageWide > first item
 */
const pickEpicImage = (keyImages = []) => {
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
    return keyImages?.[0]?.url || "";
};

/**
 * Build the Epic Games store URL from the offer object.
 */
const buildEpicStoreUrl = (offer) => {
    const slug =
        offer.productSlug ||
        offer.catalogNs?.mappings?.[0]?.pageSlug ||
        "";
    if (!slug) return "https://store.epicgames.com/en-US/free-games";
    return `https://store.epicgames.com/en-US/p/${slug}`;
};

// ─── EPIC SYNC ─────────────────────────────────────────────────────────────

const syncEpicDirect = async () => {
    console.log("🔄 [Epic] Fetching direct from Epic Games API…");

    const data   = await fetchEpicGames();
    const offers = data?.data?.Catalog?.searchStore?.elements || [];

    console.log(`📦 [Epic] ${offers.length} total offers received`);

    // YOUR original filter logic from test.js:
    // discountPrice === 0  AND  promotionalOffers array is non-empty (promo is live)
    const activeFreeGames = offers.filter((offer) => {
        const isPriceZero   = offer.price?.totalPrice?.discountPrice === 0;
        const hasActivePromo = offer.promotions?.promotionalOffers?.length > 0;
        return isPriceZero && hasActivePromo;
    });

    console.log(`🎮 [Epic] ${activeFreeGames.length} currently free games`);

    return activeFreeGames.map((offer) => {
        const activePromo =
            offer.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0];

        return {
            externalId:            `epic_${offer.id}`,
            title:                 offer.title,
            description:           offer.description || "",
            image:                 pickEpicImage(offer.keyImages),
            originalPrice:         offer.price?.totalPrice?.originalPrice ?? 0,
            discountPrice:         0,
            formattedOriginalPrice:
                offer.price?.totalPrice?.fmtPrice?.originalPrice || "Free",
            storeUrl:              buildEpicStoreUrl(offer),
            source:                "Epic Games",
            platform:              "PC",
            promotionStart:        activePromo?.startDate ? new Date(activePromo.startDate) : null,
            promotionEnd:          activePromo?.endDate   ? new Date(activePromo.endDate)   : null,
            isFree:                true,
            fetchedAt:             new Date(),
        };
    });
};

// ─── GAMERPOWER SYNC ───────────────────────────────────────────────────────

const syncGamerPower = async () => {
    console.log("🔄 [GamerPower] Fetching from GamerPower API…");

    const giveaways = await fetchGamerPowerGames(); // already filtered to Active

    return giveaways.map((item) => ({
        externalId:            `gamerpower_${item.id}`,
        title:                 item.title,
        description:           item.description || "",
        image:                 item.image || item.thumbnail || "",
        originalPrice:         0,
        discountPrice:         0,
        formattedOriginalPrice: item.worth && item.worth !== "N/A" ? item.worth : "Free",
        storeUrl:              item.open_giveaway || item.gamerpower_url || "",
        source:                detectSource(item.platforms, item.open_giveaway || ""),
        platform:              "PC",
        promotionStart:        null,
        promotionEnd:          item.end_date && item.end_date !== "N/A"
                                   ? new Date(item.end_date)
                                   : null,
        isFree:                true,
        fetchedAt:             new Date(),
    }));
};

// ─── MASTER SYNC ──────────────────────────────────────────────────────────

export const syncAllGames = async () => {
    console.log("\n════════════════════════════════════════");
    console.log("🚀 [Sync] Starting full sync…");
    console.log("════════════════════════════════════════");

    const results = await Promise.allSettled([
        syncEpicDirect(),
        syncGamerPower(),
    ]);

    // Collect all games from both sources
    const allGames = [];

    results.forEach((result, i) => {
        const source = i === 0 ? "Epic (direct)" : "GamerPower";
        if (result.status === "fulfilled") {
            console.log(`✅ [${source}] ${result.value.length} games ready to upsert`);
            allGames.push(...result.value);
        } else {
            console.error(`❌ [${source}] Failed: ${result.reason?.message}`);
        }
    });

    if (allGames.length === 0) {
        console.log("⚠️  [Sync] No games to save. DB unchanged.");
        return { upserted: 0, modified: 0, total: 0 };
    }

    // Deduplicate by externalId (Epic direct + GamerPower can overlap)
    const seen    = new Set();
    const unique  = allGames.filter((g) => {
        if (seen.has(g.externalId)) return false;
        seen.add(g.externalId);
        return true;
    });

    console.log(`💾 [Sync] Upserting ${unique.length} unique games into MongoDB…`);

    // Bulk upsert — insert new, update existing
    const ops = unique.map((gameData) => ({
        updateOne: {
            filter: { externalId: gameData.externalId },
            update: { $set: gameData },
            upsert: true,
        },
    }));

    const result = await Game.bulkWrite(ops);

    console.log(
        `✅ [Sync] Complete — Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}, Total in batch: ${unique.length}`
    );
    console.log("════════════════════════════════════════\n");

    return {
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
        total:    unique.length,
    };
};

// ─── CRON SCHEDULE ─────────────────────────────────────────────────────────

/**
 * Run a full sync every hour at minute 0.
 * Epic refreshes weekly on Thursdays; GamerPower picks up new drops faster.
 */
export const startSyncJob = () => {
    console.log("⏰ [Sync] Cron job registered — runs every hour.");

    cron.schedule("0 * * * *", async () => {
        console.log(`\n⏰ [Sync] Hourly cron triggered at ${new Date().toISOString()}`);
        await syncAllGames();
    });
};
