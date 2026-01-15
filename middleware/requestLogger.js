const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info('Incoming request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?._id,
    });

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';

        logger[logLevel]('Request completed', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?._id,
        });
    });

    next();
};

module.exports = requestLogger;
