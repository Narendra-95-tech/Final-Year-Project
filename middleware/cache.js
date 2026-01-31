/**
 * Response Caching Middleware
 * Caches HTML responses for public pages to improve performance
 * Cache is automatically invalidated after a set duration
 */

const NodeCache = require('node-cache');

// Create cache instance
// stdTTL: Time to live in seconds (default 5 minutes)
// checkperiod: Automatic delete check interval in seconds
const cache = new NodeCache({
    stdTTL: 300, // 5 minutes
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false // Don't clone data (faster, but be careful with mutations)
});

// Statistics
let stats = {
    hits: 0,
    misses: 0,
    sets: 0
};

/**
 * Cache middleware factory
 * @param {number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Optional custom key generator function
 * @returns {function} Express middleware
 */
function cacheMiddleware(duration = 300, keyGenerator = null) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Don't cache if user is logged in (personalized content)
        if (req.user) {
            return next();
        }

        // Generate cache key
        const key = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;

        // Try to get cached response
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            // Cache hit!
            stats.hits++;
            res.set('X-Cache', 'HIT');
            res.set('X-Cache-Key', key);
            return res.send(cachedResponse);
        }

        // Cache miss - proceed with request
        stats.misses++;

        // Store original res.send
        const originalSend = res.send.bind(res);

        // Override res.send to cache the response
        res.send = (body) => {
            // Only cache successful responses
            if (res.statusCode === 200) {
                cache.set(key, body, duration);
                stats.sets++;
                res.set('X-Cache', 'MISS');
                res.set('X-Cache-Key', key);
            }

            // Call original send
            return originalSend(body);
        };

        next();
    };
}

/**
 * Cache middleware for public pages (5 minutes)
 */
const cachePublicPages = cacheMiddleware(300);

/**
 * Cache middleware for static content (1 hour)
 */
const cacheStaticContent = cacheMiddleware(3600);

/**
 * Cache middleware for API responses (1 minute)
 */
const cacheAPIResponses = cacheMiddleware(60);

/**
 * Clear all cache
 */
function clearCache() {
    cache.flushAll();
    console.log('✅ Cache cleared');
}

/**
 * Clear specific cache key
 * @param {string} key - Cache key to clear
 */
function clearCacheKey(key) {
    cache.del(key);
    console.log(`✅ Cache key cleared: ${key}`);
}

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match (e.g., 'listings:*')
 */
function clearCacheByPattern(pattern) {
    const keys = cache.keys();
    const regex = new RegExp(pattern.replace('*', '.*'));

    keys.forEach(key => {
        if (regex.test(key)) {
            cache.del(key);
        }
    });

    console.log(`✅ Cache cleared for pattern: ${pattern}`);
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    const keys = cache.keys();
    const hitRate = stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
        : 0;

    return {
        keys: keys.length,
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        hitRate: `${hitRate}%`,
        size: cache.getStats()
    };
}

/**
 * Middleware to add cache stats to response headers (development only)
 */
function cacheStatsMiddleware(req, res, next) {
    if (process.env.NODE_ENV === 'development') {
        const stats = getCacheStats();
        res.set('X-Cache-Stats', JSON.stringify(stats));
    }
    next();
}

/**
 * Express route to view cache stats (admin only)
 */
function cacheStatsRoute(req, res) {
    const stats = getCacheStats();
    res.json({
        success: true,
        cache: stats,
        keys: cache.keys()
    });
}

/**
 * Express route to clear cache (admin only)
 */
function clearCacheRoute(req, res) {
    clearCache();
    res.json({
        success: true,
        message: 'Cache cleared successfully'
    });
}

module.exports = {
    cacheMiddleware,
    cachePublicPages,
    cacheStaticContent,
    cacheAPIResponses,
    clearCache,
    clearCacheKey,
    clearCacheByPattern,
    getCacheStats,
    cacheStatsMiddleware,
    cacheStatsRoute,
    clearCacheRoute
};
