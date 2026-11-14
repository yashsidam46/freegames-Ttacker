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
    {
        id: 2,
        title: "Grand Theft Auto V",
        genre: "Action",
        platform: "PC",
        price: 0
    },{
          id: 3,
        title: "Red Dead Redemption 2",
        genre: "Adventure",
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

    res.json({
        success : true,
        count : result.length,
        data : result
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

