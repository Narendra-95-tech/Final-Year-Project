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
        console.log('🚀 Running in standalone PWA mode');
    }

    // Always initialize these features
    initPullToRefresh();
    initOfflineDetection();
    initHapticFeedback();
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

        // Add app-like scroll behavior
        document.body.style.overscrollBehavior = 'contain';

        // Disable text selection for app-like feel
        document.body.style.webkitUserSelect = 'none';
        document.body.style.userSelect = 'none';

        // Allow text selection in inputs and textareas
        const selectableElements = document.querySelectorAll('input, textarea, [contenteditable]');
        selectableElements.forEach(el => {
            el.style.webkitUserSelect = 'text';
            el.style.userSelect = 'text';
        });
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

        // Hide splash after content loads with smooth transition
        window.addEventListener('load', () => {
            setTimeout(() => {
                splash.classList.add('hidden');
                setTimeout(() => splash.remove(), 600);
            }, 1200); // Show for at least 1.2 seconds
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
        let canPull = false;

        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh';
        indicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
        document.body.appendChild(indicator);

        document.addEventListener('touchstart', (e) => {
            if (window.pageYOffset === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
                canPull = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!pulling || !canPull) return;

            currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;

            if (pullDistance > 0 && pullDistance < 100) {
                indicator.style.top = `${pullDistance - 60}px`;
                indicator.style.transform = `rotate(${pullDistance * 3}deg)`;
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (!pulling) return;

            const pullDistance = currentY - startY;

            if (pullDistance > 80) {
                // Trigger refresh with haptic feedback
                triggerHaptic('medium');
                indicator.classList.add('active');
                indicator.style.top = '20px';
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                indicator.style.top = '-60px';
                indicator.style.transform = 'rotate(0deg)';
            }

            pulling = false;
            canPull = false;
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
     * Initialize haptic feedback
     */
    function initHapticFeedback() {
        // Check if Vibration API is supported
        if (!('vibrate' in navigator)) {
            console.log('Haptic feedback not supported');
            return;
        }

        // Add haptic feedback to buttons and links
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, .btn, .card, .mobile-nav-item');
            if (target && isStandalone) {
                triggerHaptic('light');
            }
        }, { passive: true });
    }

    /**
     * Trigger haptic feedback
     */
    function triggerHaptic(intensity = 'light') {
        if (!('vibrate' in navigator)) return;

        const patterns = {
            light: 10,
            medium: 20,
            heavy: 30
        };

        navigator.vibrate(patterns[intensity] || patterns.light);
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
