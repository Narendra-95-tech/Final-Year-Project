// PWA Installation Handler
let deferredPrompt;
let installButton;

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

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💡 PWA install prompt available');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show custom install button
    showInstallPromotion();
});

// Show install promotion
function showInstallPromotion() {
    // Create install banner if it doesn't exist
    if (!document.getElementById('pwa-install-banner')) {
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

        document.body.appendChild(banner);

        // Add event listeners
        document.getElementById('pwa-install-btn').addEventListener('click', installPWA);
        document.getElementById('pwa-dismiss-btn').addEventListener('click', dismissInstallPromotion);

        // Show banner with animation
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }
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
        dismissInstallPromotion();
    } else {
        console.log('❌ User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    deferredPrompt = null;
}

// Dismiss install promotion
function dismissInstallPromotion() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            banner.remove();
        }, 300);
    }

    // Store dismissal in localStorage (don't show again for 7 days)
    localStorage.setItem('pwa-install-dismissed', Date.now());
}

// Check if user already dismissed
window.addEventListener('load', () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
        const daysSinceDismissal = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissal < 7) {
            // Don't show banner if dismissed within last 7 days
            return;
        }
    }
});

// Detect if app is already installed
window.addEventListener('appinstalled', () => {
    console.log('✅ WanderLust has been installed');
    dismissInstallPromotion();

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

// Add CSS for install banner
const style = document.createElement('style');
style.textContent = `
  .pwa-install-banner {
    position: fixed;
    bottom: -200px;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #FF385C, #FF5A5F);
    color: white;
    padding: 16px 20px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .pwa-install-banner.show {
    bottom: 0;
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
    opacity: 0.9;
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
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .btn-install-pwa:hover {
    transform: scale(1.05);
  }
  
  .btn-dismiss-pwa {
    background: transparent;
    border: 2px solid rgba(255, 255, 255, 0.5);
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-dismiss-pwa:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: white;
  }
  
  @media (max-width: 768px) {
    .pwa-banner-text p {
      display: none;
    }
    
    .pwa-banner-content {
      gap: 12px;
    }
    
    .btn-install-pwa {
      padding: 8px 16px;
      font-size: 14px;
    }
  }
`;
document.head.appendChild(style);
