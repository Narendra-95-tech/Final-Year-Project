/**
 * Client-Side Performance Monitoring
 * Tracks Core Web Vitals and sends to server
 */

(function () {
    'use strict';

    // Check if Performance API is available
    if (!window.performance || !window.PerformanceObserver) {
        console.warn('Performance API not available');
        return;
    }

    const metrics = {
        fcp: null, // First Contentful Paint
        lcp: null, // Largest Contentful Paint
        fid: null, // First Input Delay
        cls: null, // Cumulative Layout Shift
        ttfb: null // Time to First Byte
    };

    /**
     * Get Time to First Byte
     */
    function getTTFB() {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            metrics.ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
        }
    }

    /**
     * Observe First Contentful Paint
     */
    function observeFCP() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        metrics.fcp = entry.startTime;
                        console.log('✅ FCP:', metrics.fcp.toFixed(2), 'ms');
                    }
                });
            });
            observer.observe({ entryTypes: ['paint'] });
        } catch (e) {
            console.warn('FCP observation failed:', e);
        }
    }

    /**
     * Observe Largest Contentful Paint
     */
    function observeLCP() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                metrics.lcp = lastEntry.startTime;
                console.log('✅ LCP:', metrics.lcp.toFixed(2), 'ms');
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            console.warn('LCP observation failed:', e);
        }
    }

    /**
     * Observe First Input Delay
     */
    function observeFID() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    metrics.fid = entry.processingStart - entry.startTime;
                    console.log('✅ FID:', metrics.fid.toFixed(2), 'ms');
                });
            });
            observer.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.warn('FID observation failed:', e);
        }
    }

    /**
     * Observe Cumulative Layout Shift
     */
    function observeCLS() {
        try {
            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        metrics.cls = clsValue;
                    }
                });
                console.log('✅ CLS:', metrics.cls.toFixed(4));
            });
            observer.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
            console.warn('CLS observation failed:', e);
        }
    }

    /**
     * Send metrics to server (optional)
     */
    function sendMetrics() {
        // Only send if we have some metrics
        if (!metrics.fcp && !metrics.lcp) return;

        const data = {
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: metrics,
            timestamp: new Date().toISOString()
        };

        // Send to server using sendBeacon (non-blocking)
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            navigator.sendBeacon('/api/performance-metrics', blob);
        }
    }

    /**
     * Display performance summary in console
     */
    function displaySummary() {
        console.group('📊 Performance Metrics Summary');
        console.table({
            'Time to First Byte (TTFB)': metrics.ttfb ? `${metrics.ttfb.toFixed(2)} ms` : 'N/A',
            'First Contentful Paint (FCP)': metrics.fcp ? `${metrics.fcp.toFixed(2)} ms` : 'N/A',
            'Largest Contentful Paint (LCP)': metrics.lcp ? `${metrics.lcp.toFixed(2)} ms` : 'N/A',
            'First Input Delay (FID)': metrics.fid ? `${metrics.fid.toFixed(2)} ms` : 'N/A',
            'Cumulative Layout Shift (CLS)': metrics.cls ? metrics.cls.toFixed(4) : 'N/A'
        });

        // Performance ratings
        const ratings = {
            fcp: metrics.fcp < 1800 ? '✅ Good' : metrics.fcp < 3000 ? '⚠️ Needs Improvement' : '❌ Poor',
            lcp: metrics.lcp < 2500 ? '✅ Good' : metrics.lcp < 4000 ? '⚠️ Needs Improvement' : '❌ Poor',
            fid: metrics.fid < 100 ? '✅ Good' : metrics.fid < 300 ? '⚠️ Needs Improvement' : '❌ Poor',
            cls: metrics.cls < 0.1 ? '✅ Good' : metrics.cls < 0.25 ? '⚠️ Needs Improvement' : '❌ Poor'
        };

        console.log('\n📈 Performance Ratings:');
        console.table(ratings);
        console.groupEnd();
    }

    /**
     * Initialize monitoring
     */
    function init() {
        getTTFB();
        observeFCP();
        observeLCP();
        observeFID();
        observeCLS();

        // Display summary after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                displaySummary();
                sendMetrics();
            }, 3000); // Wait 3 seconds after load to capture all metrics
        });

        // Send metrics before page unload
        window.addEventListener('beforeunload', sendMetrics);
    }

    // Start monitoring
    init();

    // Expose metrics for debugging
    window.WanderLustPerformance = {
        getMetrics: () => metrics,
        displaySummary: displaySummary
    };
})();
