const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const Vehicle = require('../models/vehicle');
const Dhaba = require('../models/dhaba');

const BASE_URL = process.env.BASE_URL || 'https://wanderlust.onrender.com';

// Sitemap XML route
router.get('/sitemap.xml', async (req, res) => {
    try {
        const [listings, vehicles, dhabas] = await Promise.all([
            Listing.find({}).select('_id updatedAt').lean(),
            Vehicle.find({}).select('_id updatedAt').lean(),
            Dhaba.find({}).select('_id updatedAt').lean(),
        ]);

        const now = new Date().toISOString();

        const staticUrls = [
            { url: '/', priority: '1.0', changefreq: 'daily' },
            { url: '/listings', priority: '0.9', changefreq: 'daily' },
            { url: '/vehicles', priority: '0.9', changefreq: 'daily' },
            { url: '/dhabas', priority: '0.9', changefreq: 'daily' },
            { url: '/search', priority: '0.8', changefreq: 'weekly' },
            { url: '/map', priority: '0.7', changefreq: 'weekly' },
            { url: '/trip-planner', priority: '0.7', changefreq: 'weekly' },
            { url: '/privacy-policy', priority: '0.4', changefreq: 'monthly' },
            { url: '/terms', priority: '0.4', changefreq: 'monthly' },
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Static pages
        for (const page of staticUrls) {
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
            xml += `    <lastmod>${now}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += `  </url>\n`;
        }

        // Dynamic listing pages
        for (const listing of listings) {
            const lastmod = listing.updatedAt ? new Date(listing.updatedAt).toISOString() : now;
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}/listings/${listing._id}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        }

        // Dynamic vehicle pages
        for (const vehicle of vehicles) {
            const lastmod = vehicle.updatedAt ? new Date(vehicle.updatedAt).toISOString() : now;
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}/vehicles/${vehicle._id}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += `  </url>\n`;
        }

        // Dynamic dhaba pages
        for (const dhaba of dhabas) {
            const lastmod = dhaba.updatedAt ? new Date(dhaba.updatedAt).toISOString() : now;
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}/dhabas/${dhaba._id}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += `  </url>\n`;
        }

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error('Sitemap generation error:', err);
        res.status(500).send('Error generating sitemap');
    }
});

module.exports = router;
