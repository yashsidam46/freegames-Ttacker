import dotenv from "dotenv";
dotenv.config();

import { fetchEpicGames } from "./src/fetchers/epic.js";

const test = async () => {
  try {
    const data = await fetchEpicGames();
    console.log("TOP LEVEL KEYS:");
console.log(Object.keys(data));

console.log("\nDATA KEYS:");
console.log(Object.keys(data.data));

console.log("\nCATALOG KEYS:");
console.log(Object.keys(data.data.Catalog));
console.log("\nSEARCH STORE KEYS:");
console.log(Object.keys(data.data.Catalog.searchStore));
  } catch (error) {
    console.error("Error:", error.message);
  }
};

test();