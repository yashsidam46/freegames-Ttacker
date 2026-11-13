
import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";




const app = express();

app.use(cors());

app.use(express.json())

app.get("/api/health",(req,res) => {
    res.json({
        status : "ok",
        message : "server is running"
    })
})

const port = 3000;
app.listen(port,() =>{
    console.log(`server running on port ${port}`)
})