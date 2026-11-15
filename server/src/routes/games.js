import express from "express"

const router = express.Router();

const games = [
      { 
            id: 1,
            title: "The Witcher 3",
            genre: "RPG",
            platform: "PC",
            price: 0 
            },
    { id: 2,
            title: "Grand Theft Auto V",
            genre: "Action",
            platform: "PC",
                price: 0 
        },
      { 
      id: 3,
       title: "Red Dead Redemption 2",
        genre: "Adventure", 
       platform: "PC",
        price: 0 
    },
      { 
      id: 4,
       title: "Cyberpunk 2077",
        genre: "RPG",
         platform: "PC",
          price: 0 
      },
      {
       id: 5,
        title: "Assassin's Creed Valhalla",
         genre: "Action",
          platform: "PC",
           price: 0 
       },
      { 
      id: 6,
       title: "Hogwarts Legacy",
        genre: "Adventure",
         platform: "PC",
          price: 0 
      },
      {
       id: 7,
        title: "Elden Ring",
         genre: "RPG",
          platform: "PC",
           price: 0 
       },
      {
       id: 8,
        title: "Forza Horizon 5",
         genre: "Racing",
          platform: "PC",
           price: 0 
       },
      { 
      id: 9,
       title: "Minecraft",
        genre: "Sandbox",
         platform: "PC",
          price: 0 
      },
      { 
      id: 10,
       title: "Far Cry 6",
        genre: "Action", 
    platform: "PC", 
    price: 0 
    },
      { 
      id: 11
    , title: "God of War",
     genre: "Adventure",
      platform: "PC",
       price: 0 
    },
      {
       id: 12,
        title: "Doom Eternal",
         genre: "Action",
          platform: "PC",
           price: 0 
       }

    ]

//get all games
router.get("/",(req,res) => {
    const {q,genre,platform} = req.query;
    let result = games;

    if(q){
        result = result.filter((game)=>
            game.title.toLocaleLowerCase().includes(q.toLocaleLowerCase())
        )
    }

    if(genre) {
        result = result.filter((game)=>
            game.genre.toLowerCase() === genre.toLocaleLowerCase()
        )
    }

    if(platform){
        result = result.filter((game)=>
            game.platform.toLowerCase() === platform.toLocaleLowerCase()
        )
    }


//SORTING 
const {sortBy,order} = req.query;

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
    const page = Number(req.query.page) ||1;
    const limit = Number(req.query.limit) || 10;
     

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

