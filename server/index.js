import gamesRouter from "./src/routes/games.js"
import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();


const app = express();

app.use(cors());

app.use(express.json())

app.get("/api/health",(req,res) => {
    res.json({
        status : "ok",
        message : "server is running"
    })
})

app.use("/api/games",gamesRouter)

const port = 3000;
app.listen(port,() =>{
    console.log(`server running on port ${port}`)
})