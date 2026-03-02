const fs = require('fs');
const path = require('path');

const images = [
    { src: 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\e693c813-14a1-43dc-8004-18e3a12512fd\\hero_bg_wanderlust_1772388648598.png', dest: 'public/images/hero-bg.png' },
    { src: 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\e693c813-14a1-43dc-8004-18e3a12512fd\\stays_card_wanderlust_1772388674807.png', dest: 'public/images/stays-card.png' },
    { src: 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\e693c813-14a1-43dc-8004-18e3a12512fd\\vehicles_card_wanderlust_1772388689099.png', dest: 'public/images/vehicles-card.png' },
    { src: 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\e693c813-14a1-43dc-8004-18e3a12512fd\\dhaba_card_wanderlust_1772388703122.png', dest: 'public/images/dhaba-card.png' }
];

images.forEach(img => {
    try {
        const destPath = path.join(process.cwd(), img.dest);
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(img.src, destPath);
        console.log(`Successfully copied ${path.basename(img.src)} to ${img.dest}`);
    } catch (err) {
        console.error(`Error copying ${img.src}: ${err.message}`);
    }
});
