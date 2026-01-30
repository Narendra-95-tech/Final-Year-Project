const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/buldhana');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Updated library with working Unsplash URLs
const library = {
    // Hotel Rama Grand (Keep existing working ones)
    // ... Actually, I can just re-download everything or just the broken ones.
    // To be safe and ensure consistency, I'll list all, but updated broken ones.

    // Urban Residency Club (Updated with reliable IDs)
    urban_residency_main: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1080", // Resort
    urban1: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1080", // Pool
    urban2: "https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?q=80&w=1080", // Pool 2
    urban3: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1080", // Room
    urban4: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1080", // Gym
    urban5: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1080", // Lounge

    // Rajesthani Dhaba (Updated with reliable IDs)
    rajasthani1: "https://images.unsplash.com/photo-1585937421612-70a008356f36?q=80&w=1080", // Thali
    rajasthani2: "https://images.unsplash.com/photo-1626777552726-4a6531934686?q=80&w=1080", // Curry
    rajasthani3: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1080", // Samosa
    rajasthani4: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1080", // Roti/Curry
    rajasthani5: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1080"  // Cat (Wait, lets pick food) -> "https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?q=80&w=1080" // Food
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
    console.log("Updates downloaded!");
}

downloadAll();
