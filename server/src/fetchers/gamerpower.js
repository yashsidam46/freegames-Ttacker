/**
 * GamerPower API — free aggregator, no API key needed.
 * Covers: Epic Games, Steam, GOG, itch.io, and more.
 * Docs: https://www.gamerpower.com/api-read
 */

const GAMERPOWER_URL =
    "https://www.gamerpower.com/api/giveaways?platform=pc&type=game&sort-by=date";

/**
 * Detect which store this giveaway belongs to from the platforms string.
 * GamerPower returns e.g. "PC, Epic Games Store" or "PC, Steam, DRM-Free"
 */
export const detectSource = (platforms = "", giveawayUrl = "") => {
    const p = platforms.toLowerCase();
    const u = giveawayUrl.toLowerCase();

    if (p.includes("epic") || u.includes("epicgames"))    return "Epic Games";
    if (p.includes("steam") || u.includes("steam"))       return "Steam";
    if (p.includes("gog") || u.includes("gog.com"))       return "GOG";
    if (p.includes("itch") || u.includes("itch.io"))      return "itch.io";
    if (p.includes("ubisoft") || u.includes("ubisoft"))   return "Ubisoft";
    if (p.includes("origin") || u.includes("origin"))     return "EA/Origin";
    return "PC";
};

/**
 * Fetch all currently active free game giveaways from GamerPower.
 * Returns an array of raw GamerPower giveaway objects.
 */
export const fetchGamerPowerGames = async () => {
    const response = await fetch(GAMERPOWER_URL, {
        headers: {
            "Accept": "application/json",
            "User-Agent": "FreeDrop/1.0",
        },
    });

    if (!response.ok) {
        throw new Error(`GamerPower API request failed: ${response.status}`);
    }

    const data = await response.json();

    // GamerPower returns an error object when there are no results
    if (!Array.isArray(data)) {
        console.warn("⚠️  [GamerPower] Unexpected response shape:", data);
        return [];
    }

    // Only keep active giveaways (status: "Active")
    const active = data.filter((g) => g.status === "Active");
    console.log(
        `📦 [GamerPower] ${data.length} total → ${active.length} active giveaways`
    );

    return active;
};
