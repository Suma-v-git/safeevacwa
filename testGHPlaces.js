import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_GH_API_KEY;

async function testPlaces() {
    console.log("Testing GraphHopper Places API with key:", API_KEY?.slice(0, 8) + "...");
    const lat = 12.9716;
    const lng = 77.5946;
    const query = 'hospital';
    const url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(query)}&point=${lat},${lng}&limit=5&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log("Success! Found", data.hits?.length || 0, "places.");
            if (data.hits && data.hits.length > 0) {
                console.log("First hit:", data.hits[0].name, data.hits[0].point);
            }
        } else {
            console.error("API Error:", response.status, response.statusText);
            const txt = await response.text();
            console.log(txt);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testPlaces();
