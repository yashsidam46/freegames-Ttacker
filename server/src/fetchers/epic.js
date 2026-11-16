const API_URL = process.env.EPIC_API_URL;

export const fetchEpicGames = async () => {
    const responce = await fetch(API_URL);

    if(!responce.ok){
        throw new Error("Failed to fetch Epic Game Data")
        
    }

    const data = await responce.json();

    return data;
}