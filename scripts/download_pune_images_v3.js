const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/pune');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Ritz-Carlton (Verified JD)
// 2. Conrad (Verified JD)
// 3. JW Marriott (Verified JD)
// 4-10: High Quality Unsplash (Stable, visible)

const library = {
    // Ritz-Carlton (Verified)
    ritz_main: "https://content.jdmagicbox.com/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-pune-yerawada-pune-hotels-lu3w4.jpg",
    ritz1: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-6yjvlaxkc8.jpg",
    ritz2: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-jqshgr6930.jpg",
    ritz3: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-ppqmcr4f7k.jpg",
    ritz4: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-246ttg2pkf.jpg",

    // Conrad (Verified)
    conrad_main: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pgrlphka6e.jpg",
    conrad1: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pqqqoutcdo.jpg",
    conrad2: "https://content.jdmagicbox.com/v2/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-zqafxfbtj2.jpg",
    conrad3: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-phfrn62rfo.jpg",
    conrad4: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-ix0n7vi7t7.jpg",

    // JW Marriott (Verified)
    jw_main: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-b7fm5ukiei-250.jpg",
    jw1: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-v346m2u03t-250.jpg",
    jw2: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-d0zwvuvufh-250.jpg",
    jw3: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-ws17uyv6gl-250.jpg",
    jw4: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-n1s9mgbz70-250.jpg",

    // 4. Sheraton Grand (High Quality Proxies)
    sheraton_main: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1080",
    sheraton1: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1080",
    sheraton2: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1080",
    sheraton3: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?q=80&w=1080",
    sheraton4: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1080",

    // 5. Corinthians (High Quality Proxies)
    corinthians_main: "https://images.unsplash.com/photo-1571896349842-6e5c48b47a3d?q=80&w=1080",
    corinthians1: "https://images.unsplash.com/photo-1562790351-d273a961e0e9?q=80&w=1080",
    corinthians2: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1080",
    corinthians3: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1080",
    corinthians4: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1080",

    // 6. Blue Diamond (Proxies)
    blue_main: "https://images.unsplash.com/photo-1560662105-57f8ad6ae2d1?q=80&w=1080",
    blue1: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1080",
    blue2: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1080",
    blue3: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1080",
    blue4: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1080",

    // 7. Novotel (Proxies)
    novotel_main: "https://images.unsplash.com/photo-1455587734955-081b22074882?q=80&w=1080",
    novotel1: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1080",
    novotel2: "https://images.unsplash.com/photo-1584622640111-994a426fbf0a?q=80&w=1080",
    novotel3: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1080",
    novotel4: "https://images.unsplash.com/photo-1562790351-d273a961e0e9?q=80&w=1080",

    // 8. Hyatt Pune (Proxies)
    hyatt_main: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1080",
    hyatt1: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1080",
    hyatt2: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1080",
    hyatt3: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?q=80&w=1080",
    hyatt4: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1080",

    // 9. Westin (Proxies)
    westin_main: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1080",
    westin1: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1080",
    westin2: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1080",
    westin3: "https://images.unsplash.com/photo-1560662105-57f8ad6ae2d1?q=80&w=1080",
    westin4: "https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?q=80&w=1080",

    // 10. O Hotel (Proxies)
    ohotel_main: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1080",
    ohotel1: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1080",
    ohotel2: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1080",
    ohotel3: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1080",
    ohotel4: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1080"
};

async function downloadImage(name, url) {
    const filePath = path.join(targetDir, name + '.jpg');
    console.log(`Downloading ${name} from ${url}...`);
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                // Important for Justdial
                'Referer': 'https://www.justdial.com/',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
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
    console.log("All Pune images downloaded!");
}

downloadAll();
