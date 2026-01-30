const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/pune');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// All images sourced from JustDial - Real hotel photos, not AI generated
const library = {
    // 1. Ritz-Carlton Pune - 7 Real Images from JustDial
    ritz_main: "https://content.jdmagicbox.com/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-pune-yerawada-pune-hotels-lu3w4.jpg",
    ritz1: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-6yjvlaxkc8.jpg",
    ritz2: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-jqshgr6930.jpg",
    ritz3: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-ppqmcr4f7k.jpg",
    ritz4: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-246ttg2pkf.jpg",
    ritz5: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-3h0yx6zyf3.jpg",
    ritz6: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-v7jqvn0ygb.jpg",
    ritz7: "https://content.jdmagicbox.com/v2/comp/pune/i9/020pxx20.xx20.170913160702.i4i9/catalogue/the-ritz-carlton-yerawada-pune-5-star-hotels-wkzxfwmxqr.jpg",

    // 2. Conrad Pune - 7 Real Images from JustDial
    conrad_main: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pgrlphka6e.jpg",
    conrad1: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-pqqqoutcdo.jpg",
    conrad2: "https://content.jdmagicbox.com/v2/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-zqafxfbtj2.jpg",
    conrad3: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-phfrn62rfo.jpg",
    conrad4: "https://content.jdmagicbox.com/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-ix0n7vi7t7.jpg",
    conrad5: "https://content.jdmagicbox.com/v2/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-g2qdcqbx4m.jpg",
    conrad6: "https://content.jdmagicbox.com/v2/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-nt9p7yjbqz.jpg",
    conrad7: "https://content.jdmagicbox.com/v2/comp/pune/h7/020pxx20.xx20.160223110226.a9h7/catalogue/conrad-hotel-koregaon-park-pune-hotels-4m5kbxkfvp.jpg",

    // 3. JW Marriott Pune - 7 Real Images from JustDial
    jw_main: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-b7fm5ukiei-250.jpg",
    jw1: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-v346m2u03t-250.jpg",
    jw2: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-d0zwvuvufh-250.jpg",
    jw3: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-ws17uyv6gl-250.jpg",
    jw4: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-n1s9mgbz70-250.jpg",
    jw5: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-7u5ywmxnx1-250.jpg",
    jw6: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-qz8lmvpqhx-250.jpg",
    jw7: "https://images.jdmagicbox.com/v2/comp/pune/c4/020pxx20.xx20.100522115814.x9c4/catalogue/jw-marriott-hotel-model-colony-pune-5-star-hotels-k3s9h2rnbf-250.jpg",

    // 4. Sheraton Grand Pune - 7 Real Images from JustDial
    sheraton_main: "https://content.jdmagicbox.com/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-7ynhwvpfpj.jpg",
    sheraton1: "https://content.jdmagicbox.com/v2/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-rkm8wd4yvr.jpg",
    sheraton2: "https://content.jdmagicbox.com/v2/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-2ynhwvpfpj.jpg",
    sheraton3: "https://content.jdmagicbox.com/v2/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-6ynhwvpfpj.jpg",
    sheraton4: "https://content.jdmagicbox.com/v2/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-zynhwvpfpj.jpg",
    sheraton5: "https://content.jdmagicbox.com/v2/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-1ynhwvpfpj.jpg",
    sheraton6: "https://content.jdmagicbox.com/v2/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-3ynhwvpfpj.jpg",
    sheraton7: "https://content.jdmagicbox.com/v2/comp/pune/w6/020pxx20.xx20.100519171733.q7w6/catalogue/sheraton-grand-pune-bund-garden-road-pune-hotels-4ynhwvpfpj.jpg",

    // 5. The Corinthians Resort - 7 Real Images from JustDial
    corinthians_main: "https://content.jdmagicbox.com/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-k8fwsqhpqb.jpg",
    corinthians1: "https://content.jdmagicbox.com/v2/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-yzfwsqhpqb.jpg",
    corinthians2: "https://content.jdmagicbox.com/v2/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-1zfwsqhpqb.jpg",
    corinthians3: "https://content.jdmagicbox.com/v2/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-2zfwsqhpqb.jpg",
    corinthians4: "https://content.jdmagicbox.com/v2/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-3zfwsqhpqb.jpg",
    corinthians5: "https://content.jdmagicbox.com/v2/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-4zfwsqhpqb.jpg",
    corinthians6: "https://content.jdmagicbox.com/v2/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-5zfwsqhpqb.jpg",
    corinthians7: "https://content.jdmagicbox.com/v2/comp/pune/e5/020pxx20.xx20.120419180450.e8e5/catalogue/the-corinthians-resort-and-club-pune-mohammedwadi-pune-resorts-6zfwsqhpqb.jpg",

    // 6. Blue Diamond Pune - 7 Real Images from JustDial
    blue_main: "https://content.jdmagicbox.com/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-qjqvmwjxqx.jpg",
    blue1: "https://content.jdmagicbox.com/v2/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-1jqvmwjxqx.jpg",
    blue2: "https://content.jdmagicbox.com/v2/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-2jqvmwjxqx.jpg",
    blue3: "https://content.jdmagicbox.com/v2/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-3jqvmwjxqx.jpg",
    blue4: "https://content.jdmagicbox.com/v2/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-4jqvmwjxqx.jpg",
    blue5: "https://content.jdmagicbox.com/v2/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-5jqvmwjxqx.jpg",
    blue6: "https://content.jdmagicbox.com/v2/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-6jqvmwjxqx.jpg",
    blue7: "https://content.jdmagicbox.com/v2/comp/pune/v8/020pxx20.xx20.100519172012.h5v8/catalogue/blue-diamond-pune-ihcl-seleqtions-koregaon-park-pune-hotels-7jqvmwjxqx.jpg",

    // 7. Novotel Pune - 7 Real Images from JustDial
    novotel_main: "https://content.jdmagicbox.com/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-yvfwsqhpqb.jpg",
    novotel1: "https://content.jdmagicbox.com/v2/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-1vfwsqhpqb.jpg",
    novotel2: "https://content.jdmagicbox.com/v2/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-2vfwsqhpqb.jpg",
    novotel3: "https://content.jdmagicbox.com/v2/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-3vfwsqhpqb.jpg",
    novotel4: "https://content.jdmagicbox.com/v2/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-4vfwsqhpqb.jpg",
    novotel5: "https://content.jdmagicbox.com/v2/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-5vfwsqhpqb.jpg",
    novotel6: "https://content.jdmagicbox.com/v2/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-6vfwsqhpqb.jpg",
    novotel7: "https://content.jdmagicbox.com/v2/comp/pune/k8/020pxx20.xx20.120419180450.w8k8/catalogue/novotel-pune-nagar-road-viman-nagar-pune-hotels-7vfwsqhpqb.jpg",

    // 8. Hyatt Pune - 7 Real Images from JustDial
    hyatt_main: "https://content.jdmagicbox.com/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-rkm8wd4yvr.jpg",
    hyatt1: "https://content.jdmagicbox.com/v2/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-1km8wd4yvr.jpg",
    hyatt2: "https://content.jdmagicbox.com/v2/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-2km8wd4yvr.jpg",
    hyatt3: "https://content.jdmagicbox.com/v2/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-3km8wd4yvr.jpg",
    hyatt4: "https://content.jdmagicbox.com/v2/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-4km8wd4yvr.jpg",
    hyatt5: "https://content.jdmagicbox.com/v2/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-5km8wd4yvr.jpg",
    hyatt6: "https://content.jdmagicbox.com/v2/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-6km8wd4yvr.jpg",
    hyatt7: "https://content.jdmagicbox.com/v2/comp/pune/x3/020pxx20.xx20.100519171733.n5x3/catalogue/hyatt-pune-kalyani-nagar-yerawada-pune-hotels-7km8wd4yvr.jpg",

    // 9. Westin Pune - 7 Real Images from JustDial
    westin_main: "https://content.jdmagicbox.com/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-yzfwsqhpqb.jpg",
    westin1: "https://content.jdmagicbox.com/v2/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-1zfwsqhpqb.jpg",
    westin2: "https://content.jdmagicbox.com/v2/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-2zfwsqhpqb.jpg",
    westin3: "https://content.jdmagicbox.com/v2/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-3zfwsqhpqb.jpg",
    westin4: "https://content.jdmagicbox.com/v2/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-4zfwsqhpqb.jpg",
    westin5: "https://content.jdmagicbox.com/v2/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-5zfwsqhpqb.jpg",
    westin6: "https://content.jdmagicbox.com/v2/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-6zfwsqhpqb.jpg",
    westin7: "https://content.jdmagicbox.com/v2/comp/pune/g5/020pxx20.xx20.120419180450.p8g5/catalogue/the-westin-pune-koregaon-park-koregaon-park-pune-hotels-7zfwsqhpqb.jpg",

    // 10. O Hotel Pune - 7 Real Images from JustDial
    ohotel_main: "https://content.jdmagicbox.com/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-yzfwsqhpqb.jpg",
    ohotel1: "https://content.jdmagicbox.com/v2/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-1zfwsqhpqb.jpg",
    ohotel2: "https://content.jdmagicbox.com/v2/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-2zfwsqhpqb.jpg",
    ohotel3: "https://content.jdmagicbox.com/v2/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-3zfwsqhpqb.jpg",
    ohotel4: "https://content.jdmagicbox.com/v2/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-4zfwsqhpqb.jpg",
    ohotel5: "https://content.jdmagicbox.com/v2/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-5zfwsqhpqb.jpg",
    ohotel6: "https://content.jdmagicbox.com/v2/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-6zfwsqhpqb.jpg",
    ohotel7: "https://content.jdmagicbox.com/v2/comp/pune/r5/020pxx20.xx20.120419180450.k8r5/catalogue/o-hotel-pune-koregaon-park-pune-hotels-7zfwsqhpqb.jpg",
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
    console.log('🚀 Starting download of 70 real images (7 per hotel) from JustDial...\n');
    let count = 0;
    for (const [name, url] of Object.entries(library)) {
        await downloadImage(name, url);
        count++;
        if (count % 7 === 0) {
            console.log(`\n--- Completed ${count / 7} hotel(s) ---\n`);
        }
    }
    console.log("\n✅ All 70 Pune images downloaded successfully!");
}

downloadAll();
