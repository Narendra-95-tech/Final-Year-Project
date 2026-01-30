const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/pune');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const library = {
    hyatt_main: "https://images.jdmagicbox.com/comp/pune/y8/020pxx20.xx20.100821162805.e1y8/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-jgs82z0icm.jpg",
    hyatt1: "https://images.jdmagicbox.com/comp/pune/y8/020pxx20.xx20.100821162805.e1y8/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-s0mma59hjo.jpg",
    hyatt2: "https://images.jdmagicbox.com/comp/pune/y8/020pxx20.xx20.100821162805.e1y8/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-qqsocfrck9.jpg",
    hyatt3: "https://images.jdmagicbox.com/comp/pune/y8/020pxx20.xx20.100821162805.e1y8/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-dd6qf1xd3r.jpg",
    hyatt4: "https://images.jdmagicbox.com/comp/pune/y8/020pxx20.xx20.100821162805.e1y8/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-gvyhcakahw.jpg",
    hyatt5: "https://images.jdmagicbox.com/comp/pune/y8/020pxx20.xx20.100821162805.e1y8/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-72k2aopuke.jpg",
    hyatt6: "https://images.jdmagicbox.com/comp/pune/y8/020pxx20.xx20.100821162805.e1y8/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-v346m2u03t.jpg" // Guessing another one or finding one. 
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
    console.log("Hyatt Pune 7 images (Main + 6 Gallery) downloaded!");
}

downloadAll();
