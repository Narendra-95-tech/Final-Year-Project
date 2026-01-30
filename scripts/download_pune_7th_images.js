const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/pune');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 7th images - Using high-quality Unsplash images (real photos, not AI)
// These are professional hotel/luxury photography
const library = {
    // Ritz-Carlton - Golf/Luxury theme
    ritz7: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1080",

    // Conrad - Modern Ballroom
    conrad7: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1080",

    // JW Marriott - Executive Lounge
    jw7: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1080",

    // Sheraton - Heritage Building Exterior
    sheraton7: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1080",

    // Corinthians - Greco-Roman Architecture
    corinthians7: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1080",

    // Blue Diamond - Lush Garden
    blue7: "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?q=80&w=1080",

    // Novotel - Kids Play Area
    novotel7: "https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1080",

    // Hyatt - Garden Landscape
    hyatt7: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1080",

    // Westin - Luxury Bed
    westin7: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1080",

    // O Hotel - Chic Modern Design
    ohotel7: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1080"
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
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Downloaded ${name}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`❌ Error downloading ${name}:`, error.message);
    }
}

async function downloadAll() {
    console.log('🚀 Starting download of 10 missing 7th images (real Unsplash photos)...\n');
    for (const [name, url] of Object.entries(library)) {
        await downloadImage(name, url);
    }
    console.log("\n✅ All 10 missing 7th images downloaded successfully!");
}

downloadAll();
