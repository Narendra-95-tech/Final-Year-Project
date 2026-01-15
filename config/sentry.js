const Sentry = require("@sentry/node");

const initSentry = (app) => {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.Express({ app }),
            ],
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            beforeSend(event, hint) {
                // Filter out sensitive data
                if (event.request) {
                    delete event.request.cookies;
                    if (event.request.headers) {
                        delete event.request.headers.authorization;
                        delete event.request.headers.cookie;
                    }
                }
                return event;
            },
        });

        console.log('✅ Sentry error tracking initialized');
    } else {
        console.warn('⚠️ Sentry DSN not configured - error tracking disabled');
    }
};

module.exports = { initSentry, Sentry };
