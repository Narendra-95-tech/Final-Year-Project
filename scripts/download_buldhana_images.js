const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/buldhana');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Unsplash "source.unsplash.com" is deprecated, we should use direct search or specific IDs if possible.
// But for a script, using a reliable random image service or specific Unsplash photo IDs is better.
// Since I don't have API keys, I will use "https://source.unsplash.com/random?query" style if it still works, 
// OR better, specific high quality Unsplash Image IDs to ensure they look good and are "real" photos.
// Actually, source.unsplash.com is often redirected. 
// A better way is to use specific known reliable image URLs from Pexels or Unsplash directly.

// Let's use specific Unsplash IDs for reliability.
const library = {
    // Hotel Rama Grand (Hotel, Luxury, Building)
    rama_grand_main: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1080",
    rama1: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1080", // Exterior
    rama2: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1080", // Room
    rama3: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1080", // Restaurant
    rama4: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?q=80&w=1080", // Lobby
    rama5: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1080", // Banquet

    // Urban Residency Club (Resort, Pool, Gym)
    urban_residency_main: "https://images.unsplash.com/photo-1571896349842-6e5c48b47a3d?q=80&w=1080",
    urban1: "https://images.unsplash.com/photo-1562790351-d273a961e0e9?q=80&w=1080", // Pool
    urban2: "https://images.unsplash.com/photo-1584622640111-994a426fbf0a?q=80&w=1080", // Pool 2
    urban3: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1080", // Room
    urban4: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1080", // Gym
    urban5: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1080", // Lounge

    // Titus Heights (View, Hotel)
    titus_main: "https://images.unsplash.com/photo-1455587734955-081b22074882?q=80&w=1080",
    titus1: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1080", // Room
    titus2: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1080", // Lobby
    titus3: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1080", // Room
    titus4: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1080", // Room
    titus5: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1080", // Room

    // Suryoday Dhaba (Indian, Food, Dhaba)
    suryoday1: "https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=1080", // Chicken
    suryoday2: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1080", // Biryani
    suryoday3: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1080", // Curry
    suryoday4: "https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=1080", // Thali
    suryoday5: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=1080", // Pasta/Food

    // Rajesthani Dhaba (Rajasthani, Thali, Veg)
    rajasthani1: "https://images.unsplash.com/photo-1626082927389-d31c6d3039d9?q=80&w=1080", // Thali
    rajasthani2: "https://images.unsplash.com/photo-1505253758473-96b701d2cdcd?q=80&w=1080", // Curry
    rajasthani3: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1080", // Samosa/Snack
    rajasthani4: "https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=1080", // Curry
    rajasthani5: "https://images.unsplash.com/photo-1678280649779-113aa05e94b1?q=80&w=1080"  // Dal Baati lookalike
};

async function downloadImage(name, url) {
    const filePath = path.join(targetDir, name + '.jpg');
    console.log(`Downloading ${name} from ${url}...`);
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading ${name}:`, error.message);
    }
}

async function downloadAll() {
    for (const [name, url] of Object.entries(library)) {
        await downloadImage(name, url);
    }
    console.log("All images downloaded!");
}

downloadAll();
