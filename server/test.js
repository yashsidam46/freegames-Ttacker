import dotenv from "dotenv";
dotenv.config();

import { fetchEpicGames } from "./src/fetchers/epic.js";

const test = async () => {
  try {
    const data = await fetchEpicGames();
    const SearchStores = data.data.Catalog.searchStore;
const offers = SearchStores.elements;

console.log("\nPRICE AND PROMOTION DETAILS:");
const activeFreeGames = offers.filter((offer) => {
      const isPriceZero = offer.price?.totalPrice?.discountPrice === 0;
      const hasActivePromo = offer.promotions?.promotionalOffers?.length > 0;
      
      return isPriceZero && hasActivePromo;

})
offers.forEach((offer) => {
  console.log({
    title: offer.title,
    discountPrice: offer.price?.totalPrice?.discountPrice,
    originalPrice: offer.price?.totalPrice?.originalPrice,
    promotions: offer.promotions
  });
});
/*const knightica = offers.find(
  (offer) => offer.title === "Knightica"
);
const activePromotion =
  knightica.promotions.promotionalOffers[0].promotionalOffers[0];

console.log("\nACTUAL PROMOTION:");
console.log(activePromotion);

console.log(
  JSON.stringify(knightica.promotions, null, 2)
); */
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

//const activeFreeGmaes = offer.filter((offer) => {
  //const isPriceZero = offer.price?.totalPrice?.discountPrice === 0;
  //nst hasActivePromo = offer.price?.promotions?.promotionalOffers?.length > 0;

  //return isPriceZero && hasActivePromo;
//})
console.log("\n TOTAL OFFERS FETCHED : ",offers.length);
console.log("\n ACTIVE FREE GAMES : ",activeFreeGames.length);



  } catch (error) {
    console.error("Error:", error.message);
  }
};

test();