// Push Notification Manager for WanderLust PWA
class PushNotificationManager {
    constructor() {
        this.vapidPublicKey = null;
        this.subscription = null;
    }

    // Check if push notifications are supported
    isSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported()) {
            console.warn('Push notifications are not supported');
            return false;
        }

        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission === 'granted';
    }

    // Convert VAPID key from base64 to Uint8Array
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Subscribe to push notifications
    async subscribe() {
        try {
            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Check for existing subscription
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Fetch VAPID public key from server
                const response = await fetch('/api/push/vapid-public-key');
                const { publicKey } = await response.json();
                this.vapidPublicKey = publicKey;

                // Subscribe to push notifications
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(publicKey)
                });

                console.log('✅ Push subscription created:', subscription);
            }

            this.subscription = subscription;

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);

            return subscription;
        } catch (error) {
            console.error('❌ Failed to subscribe to push notifications:', error);
            throw error;
        }
    }

    // Send subscription to backend
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });

            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }

            console.log('✅ Subscription sent to server');
            return await response.json();
        } catch (error) {
            console.error('❌ Error sending subscription:', error);
            throw error;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribe() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });

                console.log('✅ Unsubscribed from push notifications');
                this.subscription = null;
            }
        } catch (error) {
            console.error('❌ Error unsubscribing:', error);
            throw error;
        }
    }

    // Show notification permission prompt
    showPermissionPrompt() {
        if (!this.isSupported()) {
            return;
        }

        // Check if already granted or denied
        if (Notification.permission === 'granted') {
            this.subscribe();
            return;
        }

        if (Notification.permission === 'denied') {
            console.log('Notifications are blocked');
            return;
        }

        // Show custom prompt
        const banner = document.createElement('div');
        banner.id = 'notification-prompt';
        banner.className = 'notification-prompt';
        banner.innerHTML = `
      <div class="notification-prompt-content">
        <div class="notification-prompt-icon">🔔</div>
        <div class="notification-prompt-text">
          <strong>Stay Updated!</strong>
          <p>Get notified about booking confirmations and updates</p>
        </div>
        <div class="notification-prompt-actions">
          <button id="enable-notifications-btn" class="btn-enable-notifications">Enable</button>
          <button id="dismiss-notifications-btn" class="btn-dismiss-notifications">Not Now</button>
        </div>
      </div>
    `;

        document.body.appendChild(banner);

        // Add event listeners
        document.getElementById('enable-notifications-btn').addEventListener('click', async () => {
            const granted = await this.requestPermission();
            if (granted) {
                await this.subscribe();
                banner.remove();
            }
        });

        document.getElementById('dismiss-notifications-btn').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('notification-prompt-dismissed', Date.now());
        });

        // Show with animation
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }

    // Initialize on page load
    init() {
        if (!this.isSupported()) {
            console.log('Push notifications not supported');
            return;
        }

        // Auto-subscribe if permission already granted
        if (Notification.permission === 'granted') {
            this.subscribe();
        } else {
            // Show prompt after 10 seconds if not dismissed recently
            const dismissed = localStorage.getItem('notification-prompt-dismissed');
            const daysSinceDismissal = dismissed ? (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24) : 999;

            if (daysSinceDismissal > 3) {
                setTimeout(() => {
                    this.showPermissionPrompt();
                }, 10000);
            }
        }
    }
}

// Initialize notification manager
const notificationManager = new PushNotificationManager();

// Auto-init when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => notificationManager.init());
} else {
    notificationManager.init();
}

// Make available globally
window.notificationManager = notificationManager;

// Add CSS for notification prompt
const style = document.createElement('style');
style.textContent = `
  .notification-prompt {
    position: fixed;
    bottom: -200px;
    left: 0;
    right: 0;
    background: white;
    padding: 20px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .notification-prompt.show {
    bottom: 0;
  }
  
  .notification-prompt-content {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .notification-prompt-icon {
    font-size: 48px;
  }
  
  .notification-prompt-text {
    flex: 1;
  }
  
  .notification-prompt-text strong {
    display: block;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .notification-prompt-text p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
  
  .notification-prompt-actions {
    display: flex;
    gap: 12px;
  }
  
  .btn-enable-notifications {
    background: #FF385C;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .btn-enable-notifications:hover {
    transform: scale(1.05);
  }
  
  .btn-dismiss-notifications {
    background: transparent;
    border: 2px solid #ddd;
    color: #666;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-dismiss-notifications:hover {
    border-color: #999;
    color: #333;
  }
  
  @media (max-width: 768px) {
    .notification-prompt-content {
      flex-direction: column;
      text-align: center;
    }
    
    .notification-prompt-actions {
      width: 100%;
      flex-direction: column;
    }
    
    .btn-enable-notifications,
    .btn-dismiss-notifications {
      width: 100%;
    }
  }
`;
document.head.appendChild(style);
