import express from "express"

const router = express.Router();

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
    result = [...result].sort((a,b) =>{
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




export default router;

