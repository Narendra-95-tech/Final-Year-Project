/**
 * Asset Minification Script
 * Minifies CSS and JavaScript files for production
 * Run: node scripts/minify-assets.js
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

// Directories
const publicDir = path.join(__dirname, '..', 'public');
const cssDir = path.join(publicDir, 'css');
const jsDir = path.join(publicDir, 'js');
const distDir = path.join(publicDir, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

const cssDistDir = path.join(distDir, 'css');
const jsDistDir = path.join(distDir, 'js');

if (!fs.existsSync(cssDistDir)) {
    fs.mkdirSync(cssDistDir, { recursive: true });
}
if (!fs.existsSync(jsDistDir)) {
    fs.mkdirSync(jsDistDir, { recursive: true });
}

// Statistics
let stats = {
    css: { original: 0, minified: 0, saved: 0, files: 0 },
    js: { original: 0, minified: 0, saved: 0, files: 0 }
};

/**
 * Minify CSS files
 */
async function minifyCSS() {
    console.log('\n📦 Minifying CSS files...\n');

    const cleanCSS = new CleanCSS({
        level: 2, // Advanced optimizations
        compatibility: 'ie9'
    });

    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));

    for (const file of cssFiles) {
        const inputPath = path.join(cssDir, file);
        const outputPath = path.join(cssDistDir, file.replace('.css', '.min.css'));

        try {
            const input = fs.readFileSync(inputPath, 'utf8');
            const output = cleanCSS.minify(input);

            if (output.errors.length > 0) {
                console.error(`❌ Error minifying ${file}:`, output.errors);
                continue;
            }

            fs.writeFileSync(outputPath, output.styles);

            const originalSize = Buffer.byteLength(input, 'utf8');
            const minifiedSize = Buffer.byteLength(output.styles, 'utf8');
            const saved = originalSize - minifiedSize;
            const percent = ((saved / originalSize) * 100).toFixed(1);

            stats.css.original += originalSize;
            stats.css.minified += minifiedSize;
            stats.css.saved += saved;
            stats.css.files++;

            console.log(`✅ ${file}`);
            console.log(`   ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${percent}% smaller)\n`);
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    }
}

/**
 * Minify JavaScript files
 */
async function minifyJS() {
    console.log('\n📦 Minifying JavaScript files...\n');

    const jsFiles = fs.readdirSync(jsDir).filter(file =>
        file.endsWith('.js') && !file.endsWith('.min.js')
    );

    for (const file of jsFiles) {
        const inputPath = path.join(jsDir, file);
        const outputPath = path.join(jsDistDir, file.replace('.js', '.min.js'));

        try {
            const input = fs.readFileSync(inputPath, 'utf8');

            const result = await minify(input, {
                compress: {
                    dead_code: true,
                    drop_console: process.env.NODE_ENV === 'production',
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.debug']
                },
                mangle: {
                    toplevel: false
                },
                format: {
                    comments: false
                }
            });

            if (result.error) {
                console.error(`❌ Error minifying ${file}:`, result.error);
                continue;
            }

            fs.writeFileSync(outputPath, result.code);

            const originalSize = Buffer.byteLength(input, 'utf8');
            const minifiedSize = Buffer.byteLength(result.code, 'utf8');
            const saved = originalSize - minifiedSize;
            const percent = ((saved / originalSize) * 100).toFixed(1);

            stats.js.original += originalSize;
            stats.js.minified += minifiedSize;
            stats.js.saved += saved;
            stats.js.files++;

            console.log(`✅ ${file}`);
            console.log(`   ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${percent}% smaller)\n`);
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Print summary statistics
 */
function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MINIFICATION SUMMARY');
    console.log('='.repeat(60) + '\n');

    // CSS Stats
    console.log('CSS Files:');
    console.log(`  Files processed: ${stats.css.files}`);
    console.log(`  Original size:   ${formatBytes(stats.css.original)}`);
    console.log(`  Minified size:   ${formatBytes(stats.css.minified)}`);
    console.log(`  Space saved:     ${formatBytes(stats.css.saved)} (${((stats.css.saved / stats.css.original) * 100).toFixed(1)}%)\n`);

    // JS Stats
    console.log('JavaScript Files:');
    console.log(`  Files processed: ${stats.js.files}`);
    console.log(`  Original size:   ${formatBytes(stats.js.original)}`);
    console.log(`  Minified size:   ${formatBytes(stats.js.minified)}`);
    console.log(`  Space saved:     ${formatBytes(stats.js.saved)} (${((stats.js.saved / stats.js.original) * 100).toFixed(1)}%)\n`);

    // Total Stats
    const totalOriginal = stats.css.original + stats.js.original;
    const totalMinified = stats.css.minified + stats.js.minified;
    const totalSaved = stats.css.saved + stats.js.saved;

    console.log('Total:');
    console.log(`  Files processed: ${stats.css.files + stats.js.files}`);
    console.log(`  Original size:   ${formatBytes(totalOriginal)}`);
    console.log(`  Minified size:   ${formatBytes(totalMinified)}`);
    console.log(`  Space saved:     ${formatBytes(totalSaved)} (${((totalSaved / totalOriginal) * 100).toFixed(1)}%)\n`);

    console.log('='.repeat(60));
    console.log('✨ Minification complete! Files saved to /public/dist/');
    console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
    console.log('\n🚀 Starting asset minification...\n');

    try {
        await minifyCSS();
        await minifyJS();
        printSummary();

        console.log('💡 Next steps:');
        console.log('   1. Update your HTML to use minified files in production');
        console.log('   2. Example: <link rel="stylesheet" href="/dist/css/style.min.css">');
        console.log('   3. Run this script before deploying to production\n');
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { minifyCSS, minifyJS };
