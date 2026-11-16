import dotenv from "dotenv";
import { fetchEpicGames } from "./src/fetchers/epic.js";

dotenv.config();

const test = async () => {
    try {
        const data = await fetchEpicGames();

        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error:", error.message);
    }
};

test();