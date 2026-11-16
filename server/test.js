import dotenv from "dotenv";
dotenv.config();

import { fetchEpicGames } from "./src/fetchers/epic.js";

const test = async () => {
  try {
    const data = await fetchEpicGames();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
};

test();