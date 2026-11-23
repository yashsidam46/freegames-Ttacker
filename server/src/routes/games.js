import express from "express";
import Game from "../models/Game.js";
import { syncAllGames } from "../jobs/sync.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// YOUR ORIGINAL HARDCODED DATA — commented out, not deleted
// ─────────────────────────────────────────────────────────────────────────────
/*
const games = [
    {
        id: 1,
        title: "The Witcher 3",
        genre: "RPG",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg"
    },
    {
        id: 2,
        title: "Grand Theft Auto V",
        genre: "Action",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg"
    },
    {
        id: 3,
        title: "Red Dead Redemption 2",
        genre: "Adventure",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg"
    },
    {
        id: 4,
        title: "Cyberpunk 2077",
        genre: "RPG",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg"
    },
    {
        id: 5,
        title: "Assassin's Creed Valhalla",
        genre: "Action",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/2208920/header.jpg"
    },
    {
        id: 6,
        title: "Hogwarts Legacy",
        genre: "Adventure",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/990080/header.jpg"
    },
    {
        id: 7,
        title: "Elden Ring",
        genre: "RPG",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg"
    },
    {
        id: 8,
        title: "Forza Horizon 5",
        genre: "Racing",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg"
    },
    {
        id: 9,
        title: "Minecraft",
        genre: "Sandbox",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/1672970/header.jpg"
    },
    {
        id: 10,
        title: "Far Cry 6",
        genre: "Action",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/2369390/header.jpg"
    },
    {
        id: 11,
        title: "God of War",
        genre: "Adventure",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg"
    },
    {
        id: 12,
        title: "Doom Eternal",
        genre: "Action",
        platform: "PC",
        price: 0,
        image: "https://cdn.akamai.steamstatic.com/steam/apps/782330/header.jpg"
    }
]
*/

// ─────────────────────────────────────────────────────────────────────────────
// YOUR ORIGINAL ROUTE LOGIC — commented out, not deleted
// ─────────────────────────────────────────────────────────────────────────────
/*
//get all games
router.get("/",(req,res) => {

// PAGINATION VALIDATION
const page = Number(req.query.page ?? 1);
const limit = Number(req.query.limit ?? 10)

if(!Number.isInteger(page) || page<1){
    return res.status(400).json({
        success:false,
        message : "page muste be a positive integer"
    })
}

if(!Number.isInteger(limit) || limit <1 || limit >50){
    return res.status(400).json({
        success : false,
        message : "Limit must be between 1 to 50"
    })
}

//VALIDATION SORTING

const {sortBy , order} = req.query;

const allowedSortField  = ["id","price","title","genre"];

if(sortBy && !allowedSortField.includes(sortBy)){
    return res.status(400).json({
        success:false,
        message : "Invalid Sorting Field"
    })
}

if(order && !["asc","desc"].includes(order)){
    res.status(400).json({
        success:false,
        message : "Order must be Asc or Desc"
    })
}

    const q = req.query.q?.trim();
    const genre = req.query.genre?.trim().toUpperCase();
    const platform = req.query.platform?.trim().toUpperCase();
    let result = games;

    if(q){
        result = result.filter((game)=>
            game.title.toLocaleLowerCase().includes(q.toLocaleLowerCase())
        )
    }

    if(genre) {
        result = result.filter((game)=>
            game.genre.toUpperCase() === genre
        )
    }

    if(platform){
        result = result.filter((game)=>
            game.platform.toUpperCase() === platform
        )
    }


//SORTING
//const {sortBy,order} = req.query;

if(sortBy === "price" || sortBy === "id"){
    result = [...result].sort((a,b) => {
        if(order ==="desc"){
            return b[sortBy] - a[sortBy]
        }
        return a[sortBy] - b[sortBy]
    })

}

if(sortBy === "title"){
    result = [...result].sort((a,b)=>{
        return a.title.localeCompare(b.title)
    })
}

//pagination

    const startIndex = (page -1)*limit;
    const endIndex = startIndex + limit;

    const paginatedGames = result.slice(startIndex,endIndex)

    res.json({
        success : true,
        count : paginatedGames.length,
        total : result.length,
        page,
        limit,
        totalPages : Math.ceil(result.length / limit),
        data : paginatedGames
    })
})

router.get("/search", (req,res) => {
    const query = req.query.q;
    const result = games.filter((game) =>
    game.title.toLowerCase().includes(query.toLocaleLowerCase()))

    res.json({
        success : true,
        count : result.length,
        data : result
    })
})

router.get("/:id", (req,res) => {
    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id<1){
        res.status(400).json({
            success:false,
            message : "Invalid Game Id"
        })
    }

    const game = games.find(
        (g) => g.id === Number(req.params.id)
    )
    if(!game){
        return res.status(404).json({
            success : false ,
            message : "Game Not Found"
        })
    }

    res.json({
        success:true,
        data : game
    })
})
*/

// ─────────────────────────────────────────────────────────────────────────────
// NEW: MongoDB-backed routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/games
// Supports: ?page= &limit= &sortBy= &order= &q= &platform=
router.get("/", async (req, res) => {

    // PAGINATION
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    // SORTING — allowed fields map to MongoDB document fields
    const allowedSortFields = {
        title:      "title",
        price:      "originalPrice",
        date:       "promotionEnd",
        fetchedAt:  "fetchedAt",
    };

    const { sortBy, order } = req.query;

    if (sortBy && !allowedSortFields[sortBy]) {
        return res.status(400).json({
            success: false,
            message: `Invalid sortBy. Allowed: ${Object.keys(allowedSortFields).join(", ")}`,
        });
    }

    if (order && !["asc", "desc"].includes(order)) {
        return res.status(400).json({
            success: false,
            message: "Order must be 'asc' or 'desc'",
        });
    }

    // FILTERS
    const filter = { isFree: true }; // Always show only free games

    const q        = req.query.q?.trim();
    const platform = req.query.platform?.trim();
    const source   = req.query.source?.trim();   // e.g. "Epic Games", "Steam"

    if (q) {
        filter.title = { $regex: q, $options: "i" };
    }

    if (platform) {
        filter.platform = { $regex: platform, $options: "i" };
    }

    if (source) {
        filter.source = { $regex: source, $options: "i" };
    }

    try {
        const sortField = allowedSortFields[sortBy] || "fetchedAt";
        const sortDir   = order === "asc" ? 1 : -1;

        const total = await Game.countDocuments(filter);
        const games = await Game.find(filter)
            .sort({ [sortField]: sortDir })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(); // plain JS objects — faster than Mongoose documents

        res.json({
            success:    true,
            count:      games.length,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data:       games,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch games from database",
            error:   error.message,
        });
    }
});

// POST /api/games/sync — manually trigger a full re-sync (no auth needed for now)
router.post("/sync", async (req, res) => {
    try {
        console.log("🔁 [Manual Sync] Triggered via POST /api/games/sync");
        const result = await syncAllGames();
        res.json({
            success: true,
            message: "Sync complete",
            ...result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Sync failed",
            error: error.message,
        });
    }
});

// GET /api/games/sources — list all unique sources in DB
router.get("/sources", async (req, res) => {
    try {
        const sources = await Game.distinct("source", { isFree: true });
        res.json({ success: true, data: sources });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/games/:id  — fetch single game by MongoDB _id
router.get("/:id", async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).lean();

        if (!game) {
            return res.status(404).json({
                success: false,
                message: "Game not found",
            });
        }

        res.json({ success: true, data: game });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid game ID",
            error:   error.message,
        });
    }
});

export default router;
