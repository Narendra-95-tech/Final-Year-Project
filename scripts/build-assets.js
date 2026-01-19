/**
 * WanderLust Asset Build Script
 * 
 * This script bundles and minifies CSS and JavaScript files for production.
 * It creates optimized bundles that significantly reduce page load times.
 */

const fs = require('fs');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');

// Configuration
const config = {
    publicDir: path.join(__dirname, '..', 'public'),
    outputDir: path.join(__dirname, '..', 'public', 'dist'),

    // CSS bundles
    cssBundles: {
        'core.min.css': [
            'css/style.css',
            'css/rating.css',
            'css/animations.css'
        ],
        'listings.min.css': [
            'css/listings-index.css',
            'css/listing-details.css',
            'css/listing-details-responsive.css',
            'css/create-listing.css'
        ],
        'vehicles.min.css': [
            'css/vehicles.css',
            'css/vehicle-premium.css',
            'css/vehicle-management.css',
            'css/vehicle-image-upload.css'
        ],
        'dhabas.min.css': [
            'css/dhabas.css',
            'css/dhabas-responsive.css'
        ],
        'features.min.css': [
            'css/booking.css',
            'css/calendar.css',
            'css/advanced-availability.css',
            'css/ai-assistant.css',
            'css/trip-planner.css',
            'css/social.css',
            'css/dashboard.css',
            'css/admin.css'
        ],
        'maps.min.css': [
            'css/enhanced-map.css',
            'css/map-listings-view.css',
            'css/map-controls.css',
            'css/map-premium.css',
            'css/map-search.css'
        ],
        'components.min.css': [
            'css/lightbox.css',
            'css/language-selector.css',
            'css/voice-search.css',
            'css/share-premium.css',
            'css/perfect-upi.css'
        ],
        'responsive.min.css': [
            'css/responsive-forms.css',
            'css/responsive-user-pages.css',
            'css/responsive-special-features.css'
        ]
    },

    // JavaScript bundles
    jsBundles: {
        'core.min.js': [
            'js/main.js',
            'js/script.js',
            'js/animations.js',
            'js/toast-notifications.js',
            'js/language-manager.js'
        ],
        'listings.min.js': [
            'js/booking.js',
            'js/booking-widget.js',
            'js/availability-calendar.js',
            'js/advanced-availability.js',
            'js/amenities-modal.js',
            'js/description-modal.js',
            'js/policies-modal.js',
            'js/reviews-component.js'
        ],
        'vehicles.min.js': [
            'js/vehicles.js',
            'js/vehicle-image-upload.js'
        ],
        'dhabas.min.js': [
            'js/dhabas.js'
        ],
        'maps.min.js': [
            'js/enhanced-map.js',
            'js/map-listings-view.js',
            'js/map-search.js',
            'js/map.js',
            'js/map-examples.js'
        ],
        'features.min.js': [
            'js/calendar.js',
            'js/wanderlust-calendar.js',
            'js/ai-assistant-fixed.js',
            'js/tripPlanner.js',
            'js/social.js',
            'js/wishlist-handler.js',
            'js/contact-host.js',
            'js/voiceSearch.js'
        ],
        'utils.min.js': [
            'js/lazy-loading.js',
            'js/lightbox.js',
            'js/image-gallery.js'
        ]
    }
};

// Ensure output directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Read file with error handling
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.warn(`⚠️  Warning: Could not read ${filePath}: ${error.message}`);
        return '';
    }
}

// Bundle and minify CSS
async function bundleCSS() {
    console.log('\n📦 Bundling CSS files...\n');

    const cleanCSS = new CleanCSS({
        level: 2,
        returnPromise: false
    });

    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;

    for (const [outputFile, inputFiles] of Object.entries(config.cssBundles)) {
        const contents = inputFiles.map(file => {
            const filePath = path.join(config.publicDir, file);
            const content = readFile(filePath);
            if (content) {
                totalOriginalSize += content.length;
            }
            return content;
        }).filter(Boolean);

        if (contents.length === 0) {
            console.log(`⚠️  Skipping ${outputFile} - no valid input files`);
            continue;
        }

        const combined = contents.join('\n\n');
        const minified = cleanCSS.minify(combined);

        if (minified.errors.length > 0) {
            console.error(`❌ Error minifying ${outputFile}:`, minified.errors);
            continue;
        }

        const outputPath = path.join(config.outputDir, outputFile);
        fs.writeFileSync(outputPath, minified.styles);

        totalMinifiedSize += minified.styles.length;
        const reduction = ((1 - minified.styles.length / combined.length) * 100).toFixed(1);

        console.log(`✅ ${outputFile}`);
        console.log(`   ${(combined.length / 1024).toFixed(1)}KB → ${(minified.styles.length / 1024).toFixed(1)}KB (${reduction}% reduction)`);
    }

    const totalReduction = ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(1);
    console.log(`\n📊 Total CSS: ${(totalOriginalSize / 1024).toFixed(1)}KB → ${(totalMinifiedSize / 1024).toFixed(1)}KB (${totalReduction}% reduction)\n`);
}

// Bundle and minify JavaScript
async function bundleJS() {
    console.log('\n📦 Bundling JavaScript files...\n');

    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;

    for (const [outputFile, inputFiles] of Object.entries(config.jsBundles)) {
        const contents = inputFiles.map(file => {
            const filePath = path.join(config.publicDir, file);
            const content = readFile(filePath);
            if (content) {
                totalOriginalSize += content.length;
            }
            return content;
        }).filter(Boolean);

        if (contents.length === 0) {
            console.log(`⚠️  Skipping ${outputFile} - no valid input files`);
            continue;
        }

        const combined = contents.join('\n\n');

        try {
            const minified = await minifyJS(combined, {
                compress: {
                    dead_code: true,
                    drop_console: false, // Keep console for debugging
                    drop_debugger: true,
                    pure_funcs: ['console.debug']
                },
                mangle: {
                    keep_fnames: false
                },
                format: {
                    comments: false
                }
            });

            const outputPath = path.join(config.outputDir, outputFile);
            fs.writeFileSync(outputPath, minified.code);

            totalMinifiedSize += minified.code.length;
            const reduction = ((1 - minified.code.length / combined.length) * 100).toFixed(1);

            console.log(`✅ ${outputFile}`);
            console.log(`   ${(combined.length / 1024).toFixed(1)}KB → ${(minified.code.length / 1024).toFixed(1)}KB (${reduction}% reduction)`);
        } catch (error) {
            console.error(`❌ Error minifying ${outputFile}:`, error.message);
        }
    }

    const totalReduction = ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(1);
    console.log(`\n📊 Total JS: ${(totalOriginalSize / 1024).toFixed(1)}KB → ${(totalMinifiedSize / 1024).toFixed(1)}KB (${totalReduction}% reduction)\n`);
}

// Main build function
async function build() {
    console.log('🚀 Starting WanderLust Asset Build...\n');
    console.log('='.repeat(50));

    // Ensure output directory exists
    ensureDir(config.outputDir);

    try {
        await bundleCSS();
        await bundleJS();

        console.log('='.repeat(50));
        console.log('\n✨ Build completed successfully!\n');
        console.log(`📁 Output directory: ${config.outputDir}\n`);
    } catch (error) {
        console.error('\n❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build
if (require.main === module) {
    build();
}

module.exports = { build };
