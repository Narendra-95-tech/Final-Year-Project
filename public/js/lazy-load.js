/**
 * Enhanced Lazy Loading with Priority Loading
 * Optimizes image loading for better performance
 */

(function () {
    'use strict';

    // Configuration
    const config = {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01,
        loadDelay: 100 // Delay between loading images to prevent bandwidth spike
    };

    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately
        loadAllImages();
        return;
    }

    // Image loading queue
    const loadQueue = [];
    let isProcessingQueue = false;

    /**
     * Process image loading queue with delay
     */
    function processQueue() {
        if (isProcessingQueue || loadQueue.length === 0) return;

        isProcessingQueue = true;
        const img = loadQueue.shift();

        loadImage(img).then(() => {
            isProcessingQueue = false;
            if (loadQueue.length > 0) {
                setTimeout(processQueue, config.loadDelay);
            }
        });
    }

    /**
     * Load a single image
     */
    function loadImage(img) {
        return new Promise((resolve) => {
            // Handle data-src attribute
            if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
            }

            // Handle data-srcset attribute
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                delete img.dataset.srcset;
            }

            // Add loaded class for fade-in effect
            img.addEventListener('load', () => {
                img.classList.add('lazy-loaded');
                resolve();
            }, { once: true });

            // Handle error
            img.addEventListener('error', () => {
                img.classList.add('lazy-error');
                resolve();
            }, { once: true });

            // If image is already complete (cached)
            if (img.complete) {
                img.classList.add('lazy-loaded');
                resolve();
            }
        });
    }

    /**
     * Create Intersection Observer
     */
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Check priority
                const priority = img.dataset.priority || 'normal';

                if (priority === 'high') {
                    // Load immediately
                    loadImage(img);
                } else {
                    // Add to queue
                    loadQueue.push(img);
                    processQueue();
                }

                // Stop observing this image
                observer.unobserve(img);
            }
        });
    }, config);

    /**
     * Initialize lazy loading
     */
    function init() {
        // Find all images that need lazy loading
        const images = document.querySelectorAll('img[loading="lazy"], img[data-src], img[data-srcset]');

        images.forEach(img => {
            // Add loading attribute if not present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Observe the image
            imageObserver.observe(img);
        });

        // Preload high-priority images
        const priorityImages = document.querySelectorAll('img[data-priority="high"]');
        priorityImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src || img.dataset.src;
            if (img.srcset || img.dataset.srcset) {
                link.imagesrcset = img.srcset || img.dataset.srcset;
            }
            document.head.appendChild(link);
        });
    }

    /**
     * Fallback: Load all images immediately
     */
    function loadAllImages() {
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
            }
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                delete img.dataset.srcset;
            }
            img.classList.add('lazy-loaded');
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Add CSS for smooth transitions
    const style = document.createElement('style');
    style.textContent = `
    img[loading="lazy"]:not(.lazy-loaded) {
      opacity: 0;
      transition: opacity 0.3s ease-in;
    }
    
    img.lazy-loaded {
      opacity: 1 !important;
    }
    
    /* Placeholder for images with data-src */
    img[data-src]:not(.lazy-loaded) {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: lazy-loading-skeleton 1.5s infinite;
      min-height: 200px;
    }
    
    @keyframes lazy-loading-skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Error state */
    img.lazy-error {
      opacity: 0.5;
      filter: grayscale(100%);
    }
  `;
    document.head.appendChild(style);
})();
