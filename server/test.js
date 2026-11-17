import dotenv from "dotenv";
dotenv.config();

import { fetchEpicGames } from "./src/fetchers/epic.js";

const test = async () => {
  try {
    const data = await fetchEpicGames();
    const SearchStores = data.data.Catalog.searchStore;
const offers = SearchStores.elements;

    /*console.log("TOP LEVEL KEYS:");
console.log(Object.keys(data));

console.log("\nDATA KEYS:");
console.log(Object.keys(data.data));

console.log("\nCATALOG KEYS:");
console.log(Object.keys(data.data.Catalog));
console.log("\nSEARCH STORE KEYS:");
console.log(Object.keys(data.data.Catalog.searchStore));
*/
console.log("\n Total Offers : ",offers.length);

console.log("\nFIRST OFFER:");
console.log(JSON.stringify(offers[0], null, 2));


  } catch (error) {
    console.error("Error:", error.message);
  }
};

test();