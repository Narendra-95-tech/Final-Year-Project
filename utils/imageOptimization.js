/**
 * Image Optimization Middleware
 * Automatically optimizes images served through Cloudinary
 */

const cloudinary = require('cloudinary').v2;

/**
 * Get optimized Cloudinary URL
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Optimization options
 * @returns {string} Optimized image URL
 */
function getOptimizedImageUrl(publicId, options = {}) {
    const defaultOptions = {
        fetch_format: 'auto', // Automatically deliver WebP to supported browsers
        quality: 'auto:good', // Automatic quality optimization
        flags: 'progressive', // Progressive JPEG loading
        ...options
    };

    // Add responsive sizing if width is specified
    if (options.width) {
        defaultOptions.width = options.width;
        defaultOptions.crop = options.crop || 'limit'; // Don't upscale
    }

    return cloudinary.url(publicId, defaultOptions);
}

/**
 * Get responsive image URLs for srcset
 * @param {string} publicId - Cloudinary public ID
 * @param {array} widths - Array of widths for responsive images
 * @returns {string} srcset string
 */
function getResponsiveImageSrcset(publicId, widths = [320, 640, 960, 1280, 1920]) {
    return widths
        .map(width => {
            const url = getOptimizedImageUrl(publicId, { width });
            return `${url} ${width}w`;
        })
        .join(', ');
}

/**
 * Get thumbnail URL
 * @param {string} publicId - Cloudinary public ID
 * @param {number} size - Thumbnail size
 * @returns {string} Thumbnail URL
 */
function getThumbnailUrl(publicId, size = 200) {
    return getOptimizedImageUrl(publicId, {
        width: size,
        height: size,
        crop: 'fill',
        gravity: 'auto', // Smart cropping
        quality: 'auto:good'
    });
}

/**
 * Get placeholder (blur-up) URL
 * @param {string} publicId - Cloudinary public ID
 * @returns {string} Placeholder URL
 */
function getPlaceholderUrl(publicId) {
    return getOptimizedImageUrl(publicId, {
        width: 50,
        quality: 'auto:low',
        effect: 'blur:1000'
    });
}

/**
 * Express middleware to add image optimization helpers to res.locals
 */
function imageOptimizationMiddleware(req, res, next) {
    res.locals.optimizeImage = getOptimizedImageUrl;
    res.locals.responsiveImage = getResponsiveImageSrcset;
    res.locals.thumbnail = getThumbnailUrl;
    res.locals.placeholder = getPlaceholderUrl;
    next();
}

module.exports = {
    getOptimizedImageUrl,
    getResponsiveImageSrcset,
    getThumbnailUrl,
    getPlaceholderUrl,
    imageOptimizationMiddleware
};
