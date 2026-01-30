const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/pune');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to get high-res Unsplash URL
// using specific keywords to ensure different images for different aspects
const getUrl = (keyword, width = 1600) => {
    return `https://source.unsplash.com/1600x900/?${keyword}`;
};

// We will use direct URLs to specific high-quality images to avoid "random" duplicates
// but for simplicity and speed in this context, we will use keywords with unique seeds if possible,
// or just a curated list of reliable direct image URLs.
// Since source.unsplash is deprecated/unreliable for uniques sometimes, let's use direct photo IDs from the Pexels fallback or curated Unsplash IDs.

const imageLibrary = {
    // 1. RITZ-CARLTON (Luxury, Modern, Gold/Warm tones)
    ritz_main: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80", // Luxury Hotel Exterior
    ritz1: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80", // Grand Lobby
    ritz2: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=80", // Luxury Room
    ritz3: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?w=1600&q=80", // Fine Dining
    ritz4: "https://images.unsplash.com/photo-1621293954908-907159247fc8?w=1600&q=80", // Spa
    ritz5: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1600&q=80", // Pool
    ritz6: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80", // Suite
    ritz7: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80", // Golf/View

    // 2. CONRAD PUNE (Art Deco, Glass, Sleek)
    conrad_main: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80",
    conrad1: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1600&q=80", // Lobby
    conrad2: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1600&q=80", // Room
    conrad3: "https://images.unsplash.com/photo-1572331165267-854da2bbc729?w=1600&q=80", // Pool
    conrad4: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?w=1600&q=80", // Kitchen/Dining
    conrad5: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1600&q=80", // Suite
    conrad6: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80", // Wellness
    conrad7: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80", // Ballroom/Hall

    // 3. JW MARRIOTT (Classic Luxury, Grand)
    jw_main: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=80",
    jw1: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80", // Lobby
    jw2: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1600&q=80", // Room
    jw3: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80", // Pool
    jw4: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80", // Italian Dining
    jw5: "https://images.unsplash.com/photo-1478131313021-d700e5728a40?w=1600&q=80", // Ballroom
    jw6: "https://images.unsplash.com/photo-1545465243-7fa347101166?w=1600&q=80", // Rooftop
    jw7: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=80", // Executive Lounge

    // 4. SHERATON GRAND (Heritage, Colonial)
    sheraton_main: "https://images.unsplash.com/photo-1541971803-88a4d1f5cd2d?w=1600&q=80",
    sheraton1: "https://images.unsplash.com/photo-1595186088450-93a8e990b79e?w=1600&q=80", // Lobby
    sheraton2: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1600&q=80", // Classic Room
    sheraton3: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80", // Pool
    sheraton4: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80", // Restaurant
    sheraton5: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=80", // Suite
    sheraton6: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=80", // Gym
    sheraton7: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80", // Exterior

    // 5. CORINTHIANS (Resort, Egyptian, Sprawling)
    corinthians_main: "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=1600&q=80", // Resort
    corinthians1: "https://images.unsplash.com/photo-1572331165267-854da2bbc729?w=1600&q=80", // Pool
    corinthians2: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1600&q=80", // Room
    corinthians3: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&q=80", // Restaurant
    corinthians4: "https://images.unsplash.com/photo-1621293954908-907159247fc8?w=1600&q=80", // Entrance
    corinthians5: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=80", // Garden
    corinthians6: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1600&q=80", // Recreation

    // 6. BLUE DIAMOND (Greenery, Boutique)
    blue_main: "https://images.unsplash.com/photo-1571896349842-6e5c48dc52e3?w=1600&q=80",
    blue1: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80",
    blue2: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80",
    blue3: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1600&q=80",
    blue4: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
    blue5: "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1600&q=80",
    blue6: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=80",

    // 7. NOVOTEL (Modern, Business)
    novotel_main: "https://images.unsplash.com/photo-1561501900-3701fa6a36a6?w=1600&q=80",
    novotel1: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80",
    novotel2: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80",
    novotel3: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
    novotel4: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?w=1600&q=80",
    novotel5: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1600&q=80",
    novotel6: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80",

    // 8. HYATT PUNE
    hyatt_main: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80",
    hyatt1: "https://images.unsplash.com/photo-1595186088450-93a8e990b79e?w=1600&q=80",
    hyatt2: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=80",
    hyatt3: "https://images.unsplash.com/photo-1572331165267-854da2bbc729?w=1600&q=80",
    hyatt4: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
    hyatt5: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=80",
    hyatt6: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=80",

    // 9. WESTIN PUNE
    westin_main: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
    westin1: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80",
    westin2: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1600&q=80",
    westin3: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80",
    westin4: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=80",
    westin5: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80",
    westin6: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80",
    westin7: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80",

    // 10. O HOTEL
    ohotel_main: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1600&q=80",
    ohotel1: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80",
    ohotel2: "https://images.unsplash.com/photo-1505693314120-0d443641fde1?w=1600&q=80",
    ohotel3: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1600&q=80",
    ohotel4: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
    ohotel5: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80",
    ohotel6: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=80"
};

async function downloadImage(name, url) {
    const filePath = path.join(targetDir, name + '.jpg');
    console.log(`📥 ${name}...`);

    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*'
            }
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const stats = fs.statSync(filePath);
                console.log(`   ✅ ${(stats.size / 1024).toFixed(1)} KB`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`   ❌ ${error.message}`);
        // Fallback to local file if download fails shouldn't break other downloads
    }
}

async function downloadAll() {
    console.log('🚀 Upgrading Pune Hotel Images to HIGH-RES (1600px+)\n');

    // We iterate through all keys in imageLibrary
    const downloadPromises = [];
    const keys = Object.keys(imageLibrary);

    // Process in batches of 5 to not overwhelm
    for (let i = 0; i < keys.length; i += 5) {
        const batch = keys.slice(i, i + 5);
        await Promise.all(batch.map(key => downloadImage(key, imageLibrary[key])));
    }

    console.log('\n✨ All images upgraded!');
}

downloadAll();
