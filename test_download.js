const axios = require('axios');
const fs = require('fs');

async function testDownload() {
    // TripAdvisor URL
    const url = "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/4b/39/10/exterior.jpg?w=1200&h=-1&s=1";
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const writer = fs.createWriteStream('test_img.jpg');
        response.data.pipe(writer);
        console.log("Success!");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
testDownload();
