/**
 * PWA App Mode JavaScript
 * Enhances PWA to feel like a native app
 */

(function () {
    'use strict';

    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');

    // Initialize app mode features
    if (isStandalone) {
        initStandaloneMode();
    }

    // Always initialize these features
    initPullToRefresh();
    initOfflineDetection();
    showSplashScreen();

    /**
     * Initialize standalone mode features
     */
    function initStandaloneMode() {
        console.log('🚀 Running as installed PWA');

        // Add standalone class to body
        document.body.classList.add('pwa-standalone');

        // Prevent default pull-to-refresh on mobile browsers
        let lastTouchY = 0;
        let preventPullToRefresh = false;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            lastTouchY = e.touches[0].clientY;
            preventPullToRefresh = window.pageYOffset === 0;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchYDelta = touchY - lastTouchY;
            lastTouchY = touchY;

            if (preventPullToRefresh && touchYDelta > 0) {
                e.preventDefault();
            }
        }, { passive: false });

        // Add status bar
        addStatusBar();

        // Enable page transitions
        enablePageTransitions();
    }

    /**
     * Add iOS-style status bar
     */
    function addStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'app-status-bar';
        document.body.prepend(statusBar);
    }

    /**
     * Show splash screen on app load
     */
    function showSplashScreen() {
        // Only show splash in standalone mode
        if (!isStandalone) return;

        const splash = document.createElement('div');
        splash.className = 'pwa-splash';
        splash.innerHTML = `
      <img src="/images/icon-192.png" alt="WanderLust" class="pwa-splash-logo">
      <div class="pwa-splash-text">WanderLust</div>
      <div class="pwa-splash-tagline">Your Travel Companion</div>
      <div class="pwa-splash-loader"></div>
    `;
        document.body.prepend(splash);

        // Hide splash after content loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                splash.classList.add('hidden');
                setTimeout(() => splash.remove(), 500);
            }, 1500);
        });
    }

    /**
     * Initialize pull-to-refresh
     */
    function initPullToRefresh() {
        if (!isStandalone) return;

        let startY = 0;
        let currentY = 0;
        let pulling = false;

        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh';
        indicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
        document.body.appendChild(indicator);

        document.addEventListener('touchstart', (e) => {
            if (window.pageYOffset === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;

            currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;

            if (pullDistance > 0 && pullDistance < 100) {
                indicator.style.top = `${pullDistance - 60}px`;
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (!pulling) return;

            const pullDistance = currentY - startY;

            if (pullDistance > 80) {
                // Trigger refresh
                indicator.classList.add('active');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                indicator.style.top = '-60px';
            }

            pulling = false;
        });
    }

    /**
     * Enable smooth page transitions
     */
    function enablePageTransitions() {
        // Add transition class to main content
        const main = document.querySelector('main');
        if (main) {
            main.classList.add('page-transition');
        }
    }

    /**
     * Detect offline/online status
     */
    function initOfflineDetection() {
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.textContent = 'You are offline';
        document.body.appendChild(indicator);

        window.addEventListener('offline', () => {
            indicator.classList.add('show');
        });

        window.addEventListener('online', () => {
            indicator.classList.remove('show');
            // Show brief "Back online" message
            indicator.textContent = 'Back online';
            indicator.style.background = '#4CAF50';
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
                setTimeout(() => {
                    indicator.textContent = 'You are offline';
                    indicator.style.background = '#FFA000';
                }, 300);
            }, 2000);
        });
    }

    /**
     * Expose utility functions
     */
    window.PWA = {
        isStandalone: isStandalone,
        isOnline: navigator.onLine,

        // Show install prompt
        showInstallPrompt: function () {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                window.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    window.deferredPrompt = null;
                });
            }
        }
    };

    // Log PWA status
    console.log('PWA Status:', {
        standalone: isStandalone,
        online: navigator.onLine,
        serviceWorker: 'serviceWorker' in navigator
    });

})();
