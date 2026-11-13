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