const csrf = require('csurf');
const validator = require('validator');

// CSRF Protection
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize all string inputs
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = validator.escape(obj[key].trim());
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// Detect suspicious patterns
const detectSuspiciousActivity = (req, res, next) => {
    const suspiciousPatterns = [
        /(\$where|\$ne|\$gt|\$lt)/i, // MongoDB operators
        /(union|select|insert|update|delete|drop|create|alter)/i, // SQL keywords
        /(<script|javascript:|onerror=|onload=)/i, // XSS patterns
    ];

    const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);

    for (let pattern of suspiciousPatterns) {
        if (pattern.test(checkString)) {
            console.error(`Suspicious activity detected from IP: ${req.ip}`);
            return res.status(400).json({
                success: false,
                error: 'Invalid request detected'
            });
        }
    }

    next();
};

module.exports = {
    csrfProtection,
    sanitizeInput,
    detectSuspiciousActivity
};
