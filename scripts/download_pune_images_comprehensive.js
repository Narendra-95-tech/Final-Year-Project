const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/pune');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

/**
 * COMPREHENSIVE PUNE HOTEL IMAGES
 * Each hotel has 7+ real, high-quality images
 * Mix of authentic hotel photos (where available) and professional hotel photography
 */

const imageLibrary = {
    // 1. RITZ-CARLTON PUNE - 7 images (5 JustDial + 2 additional luxury hotel)
    ritz_main: "https://content.jdmagicbox.com/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-pune-yerawada-pune-hotels-lu3w4.jpg",
    ritz1: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-6yjvlaxkc8.jpg",
    ritz2: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-jqshgr6930.jpg",
    ritz3: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-ppqmcr4f7k.jpg",
    ritz4: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-246ttg2pkf.jpg",
    ritz5: "https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ritz6: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 2. CONRAD PUNE - 7 images (5 JustDial + 2 additional)
    conrad_main: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pgrlphka6e.jpg",
    conrad1: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pqqqoutcdo.jpg",
    conrad2: "https://content.jdmagicbox.com/v2/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-zqafxfbtj2.jpg",
    conrad3: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-phfrn62rfo.jpg",
    conrad4: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-ix0n7vi7t7.jpg",
    conrad5: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    conrad6: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 3. JW MARRIOTT PUNE - 7 images (5 JustDial + 2 additional)
    jw_main: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-b7fm5ukiei-250.jpg",
    jw1: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-v346m2u03t-250.jpg",
    jw2: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-d0zwvuvufh-250.jpg",
    jw3: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-ws17uyv6gl-250.jpg",
    jw4: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-n1s9mgbz70-250.jpg",
    jw5: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1600",
    jw6: "https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 4. SHERATON GRAND PUNE - 7 images (luxury hotel photography)
    sheraton_main: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton1: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton2: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton4: "https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton5: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1600",
    sheraton6: "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 5. THE CORINTHIANS RESORT - 7 images (resort photography)
    corinthians_main: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians1: "https://images.pexels.com/photos/261169/pexels-photo-261169.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians2: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians3: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians4: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians5: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1600",
    corinthians6: "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 6. BLUE DIAMOND PUNE - 7 images (luxury hotel)
    blue_main: "https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue1: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue2: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue3: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue4: "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue5: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    blue6: "https://images.pexels.com/photos/261169/pexels-photo-261169.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 7. NOVOTEL PUNE - 7 images (modern hotel)
    novotel_main: "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel1: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel2: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel4: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel5: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600",
    novotel6: "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 8. HYATT PUNE - 7 images (luxury hotel)
    hyatt_main: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt1: "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt2: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt4: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt5: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1600",
    hyatt6: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 9. THE WESTIN PUNE - 7 images (luxury hotel with pool)
    westin_main: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin1: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin2: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin3: "https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin4: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin5: "https://images.pexels.com/photos/261169/pexels-photo-261169.jpeg?auto=compress&cs=tinysrgb&w=1600",
    westin6: "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=1600",

    // 10. O HOTEL PUNE - 7 images (boutique hotel)
    ohotel_main: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel1: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel2: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel3: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel4: "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel5: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600",
    ohotel6: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600"
};

async function downloadImage(name, url) {
    const filePath = path.join(targetDir, name + '.jpg');
    console.log(`📥 ${name}...`);

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
                console.log(`   ✅ ${(stats.size / 1024).toFixed(1)} KB`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`   ❌ ${error.message}`);
        throw error;
    }
}

async function downloadAll() {
    console.log('🏨 Downloading Comprehensive Pune Hotel Images\n');
    console.log('='.repeat(60));

    const hotels = {
        'Ritz-Carlton': ['ritz_main', 'ritz1', 'ritz2', 'ritz3', 'ritz4', 'ritz5', 'ritz6'],
        'Conrad': ['conrad_main', 'conrad1', 'conrad2', 'conrad3', 'conrad4', 'conrad5', 'conrad6'],
        'JW Marriott': ['jw_main', 'jw1', 'jw2', 'jw3', 'jw4', 'jw5', 'jw6'],
        'Sheraton Grand': ['sheraton_main', 'sheraton1', 'sheraton2', 'sheraton3', 'sheraton4', 'sheraton5', 'sheraton6'],
        'Corinthians': ['corinthians_main', 'corinthians1', 'corinthians2', 'corinthians3', 'corinthians4', 'corinthians5', 'corinthians6'],
        'Blue Diamond': ['blue_main', 'blue1', 'blue2', 'blue3', 'blue4', 'blue5', 'blue6'],
        'Novotel': ['novotel_main', 'novotel1', 'novotel2', 'novotel3', 'novotel4', 'novotel5', 'novotel6'],
        'Hyatt': ['hyatt_main', 'hyatt1', 'hyatt2', 'hyatt3', 'hyatt4', 'hyatt5', 'hyatt6'],
        'Westin': ['westin_main', 'westin1', 'westin2', 'westin3', 'westin4', 'westin5', 'westin6'],
        'O Hotel': ['ohotel_main', 'ohotel1', 'ohotel2', 'ohotel3', 'ohotel4', 'ohotel5', 'ohotel6']
    };

    let totalSuccess = 0;
    let totalFail = 0;

    for (const [hotelName, imageNames] of Object.entries(hotels)) {
        console.log(`\n🏨 ${hotelName} (${imageNames.length} images)`);
        console.log('-'.repeat(60));

        for (const imageName of imageNames) {
            try {
                await downloadImage(imageName, imageLibrary[imageName]);
                totalSuccess++;
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                totalFail++;
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Download Summary:`);
    console.log(`   ✅ Success: ${totalSuccess}/70 images`);
    console.log(`   ❌ Failed: ${totalFail}`);
    console.log(`   🏨 Hotels: 10 (each with 7 images)`);
    console.log('\n✨ Done!\n');
}

downloadAll();
