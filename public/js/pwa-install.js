// PWA Installation Handler
(function () {
  let deferredPrompt;
  const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';
  const DAYS_TO_WAIT_AFTER_DISMISSAL = 7;

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }

  // Check if installation should be promoted
  function shouldShowPromotion() {
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) {
      const lastDismissal = parseInt(dismissed);
      const daysSince = (Date.now() - lastDismissal) / (1000 * 60 * 60 * 24);

      if (daysSince < DAYS_TO_WAIT_AFTER_DISMISSAL) {
        console.log(`ℹ️ PWA promotion dismissed ${daysSince.toFixed(1)} days ago. Waiting ${DAYS_TO_WAIT_AFTER_DISMISSAL} days.`);
        return false;
      }
    }
    return true;
  }

  // --- Android / Desktop Logic ---
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💡 PWA install prompt available (beforeinstallprompt fired)');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show custom install button if allowed
    if (shouldShowPromotion()) {
      showInstallPromotion();
    } else {
      console.log('ℹ️ PWA promotion suppressed by dismissal logic');
    }
  });

  // --- iOS Logic ---
  // Update: Removed 'iphone' exclusion to be more inclusive of iPadOS which requests desktop site often
  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

  // Check for iOS on load
  if (isIos() && !isInStandaloneMode() && shouldShowPromotion()) {
    // Show iOS-specific banner
    showIosInstallPromotion();
  }

  // Show install promotion (for Android/Desktop)
  function showInstallPromotion() {
    // Create install banner if it doesn't exist
    if (document.getElementById('pwa-install-banner')) return;

    const banner = createBannerHTML();
    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('pwa-install-btn').addEventListener('click', installPWA);
    document.getElementById('pwa-dismiss-btn').addEventListener('click', dismissInstallPromotion);

    // Show banner with animation
    // Use a small delay to ensure DOM is ready and transition triggers
    requestAnimationFrame(() => {
      setTimeout(() => {
        banner.classList.add('show');
      }, 100);
    });
  }

  // Show iOS-specific install promotion
  function showIosInstallPromotion() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner ios-banner';
    banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">
                    <img src="/images/wanderlust-logo.svg" alt="WanderLust" width="48" height="48">
                </div>
                <div class="pwa-banner-text">
                    <strong>Install WanderLust</strong>
                    <p>Tap <svg class="ios-share-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> then "Add to Home Screen"</p>
                </div>
                <div class="pwa-banner-actions">
                    <button id="pwa-dismiss-btn" class="btn-dismiss-pwa">×</button>
                </div>
            </div>
        `;

    document.body.appendChild(banner);
    document.getElementById('pwa-dismiss-btn').addEventListener('click', dismissInstallPromotion);

    requestAnimationFrame(() => {
      setTimeout(() => banner.classList.add('show'), 100);
    });
  }

  // Helper to create the standard banner HTML
  function createBannerHTML() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-content">
        <div class="pwa-banner-icon">
          <img src="/images/wanderlust-logo.svg" alt="WanderLust" width="48" height="48">
        </div>
        <div class="pwa-banner-text">
          <strong>Install WanderLust</strong>
          <p>Get quick access and work offline</p>
        </div>
        <div class="pwa-banner-actions">
          <button id="pwa-install-btn" class="btn-install-pwa">Install</button>
          <button id="pwa-dismiss-btn" class="btn-dismiss-pwa">×</button>
        </div>
      </div>
    `;
    return banner;
  }

  // Install PWA
  async function installPWA() {
    if (!deferredPrompt) {
      console.log('❌ Install prompt not available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      removeInstallBanner();
    } else {
      console.log('❌ User dismissed the install prompt');
      // Do not suppress permanently on cancel, just close banner for this session? 
      // Or treat as dismissal? Let's treat as dismissal to avoid annoyance.
      dismissInstallPromotion();
    }

    // Clear the deferredPrompt
    deferredPrompt = null;
  }

  // Dismiss install promotion
  function dismissInstallPromotion() {
    removeInstallBanner();
    // Store dismissal in localStorage
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now());
    console.log('🚫 PWA promotion dismissed by user');
  }

  // Helper to remove banner from DOM
  function removeInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  // Detect if app is already installed
  window.addEventListener('appinstalled', () => {
    console.log('✅ WanderLust has been installed');
    removeInstallBanner();

    // Track installation (you can send this to analytics)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installed'
      });
    }
  });

  // Check if running as PWA
  function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  // Show different UI if running as PWA
  if (isPWA()) {
    console.log('🚀 Running as PWA');
    document.body.classList.add('pwa-mode');
  }

  // Add CSS for install banner (Dynamically injected to keep it self-contained)
  const style = document.createElement('style');
  style.textContent = `
  .pwa-install-banner {
    position: fixed;
    bottom: -200px; /* Start hidden below screen */
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #FF385C, #FF5A5F);
    color: white;
    padding: 12px 20px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    transition: bottom 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  
  .pwa-install-banner.show {
    bottom: 0;
    padding-bottom: env(safe-area-inset-bottom, 20px); /* Handle iPhone Home Indicator */
  }
  
  .pwa-banner-content {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .pwa-banner-icon img {
    border-radius: 12px;
    background: white;
    padding: 4px;
    display: block;
  }
  
  .pwa-banner-text {
    flex: 1;
  }
  
  .pwa-banner-text strong {
    display: block;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  
  .pwa-banner-text p {
    margin: 0;
    font-size: 14px;
    opacity: 0.95;
    line-height: 1.4;
  }
  
  .ios-share-icon {
    height: 18px;
    vertical-align: middle;
    margin: 0 4px;
    filter: brightness(0) invert(1);
    display: inline-block;
  }
  
  .pwa-banner-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .btn-install-pwa {
    background: white;
    color: #FF385C;
    border: none;
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    white-space: nowrap;
  }
  
  .btn-install-pwa:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  
  .btn-install-pwa:active {
    transform: translateY(0);
  }
  
  .btn-dismiss-pwa {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-dismiss-pwa:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  @media (max-width: 768px) {
    .pwa-banner-text p {
      display: block; /* Show text on mobile for iOS instructions */
    }
    
    .pwa-banner-content {
      gap: 12px;
    }
    
    .pwa-install-banner.ios-banner .pwa-banner-text p {
        font-size: 13px;
    }
    
    .btn-install-pwa {
      padding: 8px 16px;
      font-size: 14px;
    }
  }
`;
  document.head.appendChild(style);
})();
