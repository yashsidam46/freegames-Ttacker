export const fetchEpicGames = async () => {
  const API_URL = process.env.EPIC_API_URL;

  console.log("Epic API URL:", API_URL);

  if (!API_URL) {
    throw new Error("EPIC_API_URL is missing from .env");
  }

  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Epic API request failed: ${response.status}`);
  }

  return await response.json();
};