const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/pune');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

/**
 * CURATED REAL HOTEL IMAGES FOR PUNE LISTINGS
 * 
 * Strategy:
 * - Ritz-Carlton, Conrad, JW Marriott: Already have real JustDial images (verified working)
 * - Other hotels: Using high-quality, license-free images from Pexels that represent luxury hotels
 * 
 * Note: While these Pexels images are not the exact hotels, they are:
 * 1. Real photographs (not AI-generated)
 * 2. High-quality professional hotel photography
 * 3. Appropriate representations of 5-star luxury hotels
 * 4. Legally safe to use (Pexels license)
 * 
 * For truly authentic images of each specific hotel, you would need to:
 * - Contact hotels directly for permission to use their official photos
 * - Use hotel booking APIs (Booking.com, Agoda) which require authentication
 * - Or manually download from hotel websites (requires manual work)
 */

const library = {
    // 1. Ritz-Carlton Pune (REAL HOTEL - JustDial)
    ritz_main: "https://content.jdmagicbox.com/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-pune-yerawada-pune-hotels-lu3w4.jpg",
    ritz1: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-6yjvlaxkc8.jpg",
    ritz2: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-jqshgr6930.jpg",
    ritz3: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-ppqmcr4f7k.jpg",
    ritz4: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-246ttg2pkf.jpg",

    // 2. Conrad Pune (REAL HOTEL - JustDial)
    conrad_main: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pgrlphka6e.jpg",
    conrad1: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pqqqoutcdo.jpg",
    conrad2: "https://content.jdmagicbox.com/v2/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-zqafxfbtj2.jpg",
    conrad3: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-phfrn62rfo.jpg",
    conrad4: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-ix0n7vi7t7.jpg",

    // 3. JW Marriott Pune (REAL HOTEL - JustDial)
    jw_main: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-b7fm5ukiei-250.jpg",
    jw1: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-v346m2u03t-250.jpg",
    jw2: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-d0zwvuvufh-250.jpg",
    jw3: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-ws17uyv6gl-250.jpg",
    jw4: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-n1s9mgbz70-250.jpg",

    // 4-10: High-quality real hotel photos from Pexels (royalty-free, not AI-generated)
    // These are professional photographs of actual luxury hotels

    // 4. Sheraton Grand Pune
    sheraton_main: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton1: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton2: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton4: "https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 5. The Corinthians Resort
    corinthians_main: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians1: "https://images.pexels.com/photos/261169/pexels-photo-261169.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians2: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians3: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians4: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 6. Blue Diamond Pune
    blue_main: "https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue1: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue2: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue3: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue4: "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 7. Novotel Pune
    novotel_main: "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel1: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel2: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel4: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 8. Hyatt Pune
    hyatt_main: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt1: "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt2: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt4: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt5: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt6: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 9. The Westin Pune
    westin_main: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin1: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin2: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin3: "https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin4: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 10. O Hotel Pune
    ohotel_main: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel1: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel2: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel4: "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=1600"
};

async function downloadImage(name, url) {
    const filePath = path.join(targetDir, name + '.jpg');
    console.log(`📥 Downloading ${name}...`);

    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000,
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
                console.log(`   ✅ ${name} (${(stats.size / 1024).toFixed(1)} KB)`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`   ❌ ${name}: ${error.message}`);
        throw error;
    }
}

async function downloadAll() {
    console.log('🚀 Downloading Pune Hotel Images\n');
    console.log('='.repeat(50));

    let successCount = 0;
    let failCount = 0;
    const failed = [];

    for (const [name, url] of Object.entries(library)) {
        try {
            await downloadImage(name, url);
            successCount++;
            // Small delay to be respectful to servers
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            failCount++;
            failed.push(name);
        }
    }

    console.log('='.repeat(50));
    console.log(`\n📊 Download Summary:`);
    console.log(`   ✅ Success: ${successCount}/${Object.keys(library).length}`);
    console.log(`   ❌ Failed: ${failCount}`);

    if (failed.length > 0) {
        console.log(`\n   Failed images: ${failed.join(', ')}`);
    }

    console.log('\n✨ Done!\n');
}

downloadAll();
