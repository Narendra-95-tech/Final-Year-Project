/**
 * Wishlist Handler
 * Manages adding/removing listings to/from wishlist
 */

class WishlistHandler {
    constructor() {
        this.wishlistItems = new Set();
        this.init();
    }

    init() {
        this.loadWishlist();
        this.attachEventListeners();
        // Sync with server if logged in
        this.syncWithServer();
        // Wait for DOM to be ready for querySelectorAll
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateAllIcons());
        } else {
            this.updateAllIcons();
        }
    }

    async syncWithServer() {
        // Check if user is logged in
        const isLoggedIn = document.querySelector('meta[name="user-logged-in"]')?.content === 'true';
        if (!isLoggedIn) return;

        try {
            const response = await fetch('/api/wishlist/all');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.wishlist) {
                    // Combine all IDs from different categories
                    const allIds = [
                        ...(data.wishlist.listing || []),
                        ...(data.wishlist.vehicle || []),
                        ...(data.wishlist.dhaba || [])
                    ].map(id => typeof id === 'object' ? id._id : id);

                    this.wishlistItems = new Set(allIds);
                    this.saveWishlist();
                    this.updateAllIcons();
                }
            }
        } catch (error) {
            console.error('Error syncing wishlist with server:', error);
        }
    }

    updateAllIcons() {
        const buttons = document.querySelectorAll('[data-id]');
        buttons.forEach(btn => {
            // Check if it's a wishlist button
            if (btn.classList.contains('card-wishlist') || btn.classList.contains('wishlist-btn') || btn.classList.contains('save-btn') || btn.classList.contains('remove-btn')) {
                const id = btn.getAttribute('data-id');
                if (id && this.wishlistItems.has(id)) {
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        icon.style.color = '#ff385c';
                    }
                    btn.classList.add('active');
                }
            }
        });
    }

    loadWishlist() {
        // Load from localStorage
        const saved = localStorage.getItem('wishlist');
        if (saved) {
            try {
                const items = JSON.parse(saved);
                this.wishlistItems = new Set(items);
            } catch (e) {
                console.error('Error loading wishlist:', e);
            }
        }
    }

    saveWishlist() {
        localStorage.setItem('wishlist', JSON.stringify([...this.wishlistItems]));
    }

    attachEventListeners() {
        const wishlistBtn = document.getElementById('wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleWishlist();
            });
        }
    }

    async toggleWishlist(startListingId = null, type = 'listing') {
        // Get listing ID from argument or page
        let listingId = startListingId;

        if (!listingId) {
            const listingData = document.getElementById('listing-data');
            if (listingData) {
                try {
                    const listing = JSON.parse(listingData.textContent);
                    listingId = listing._id;
                } catch (e) {
                    console.error('Error parsing listing data:', e);
                    return;
                }
            }
        }

        if (!listingId) return;

        // Check if user is logged in
        const isLoggedIn = document.querySelector('meta[name="user-logged-in"]')?.content === 'true';

        if (!isLoggedIn) {
            // Redirect to login
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        const isInWishlist = this.wishlistItems.has(listingId);

        try {
            if (isInWishlist) {
                // Remove from wishlist
                await this.removeFromWishlist(listingId, type);
                this.showNotification('Removed from wishlist');
            } else {
                // Add to wishlist
                await this.addToWishlist(listingId, type);
                this.showNotification('Added to wishlist');
            }

            this.saveWishlist();
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            this.showNotification('Error updating wishlist', 'error');
        }
    }

    async addToWishlist(listingId, type = 'listing') {
        const response = await fetch(`/api/wishlist/${type}/${listingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Failed to add to wishlist');
        }

        // Keep local state in sync
        this.wishlistItems.add(listingId);
        this.saveWishlist();
        this.updateWishlistIcon(listingId);

        return response.json();
    }

    async removeFromWishlist(listingId, type = 'listing') {
        const response = await fetch(`/api/wishlist/${type}/${listingId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Failed to remove from wishlist');
        }

        // Keep local state in sync
        this.wishlistItems.delete(listingId);
        this.saveWishlist();
        this.updateWishlistIcon(listingId);

        return response.json();
    }

    isInWishlist(listingId) {
        return this.wishlistItems.has(listingId);
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `wishlist-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    updateWishlistIcon(listingId) {
        // Update all buttons for this listing (using data-id)
        // This covers card-wishlist, wishlist-btn, and save-btn if they have data-id
        const buttons = document.querySelectorAll(`[data-id="${listingId}"]`);

        const isInWishlist = this.isInWishlist(listingId);

        buttons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (isInWishlist) {
                if (icon) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    icon.style.color = '#ff385c'; // Airbnb red
                }
                btn.classList.add('active');
            } else {
                if (icon) {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    icon.style.color = ''; // Reset color
                }
                btn.classList.remove('active');
            }
        });

        // Fallback for show page button if it lacks data-id but has ID 'wishlist-btn'
        // AND match the listingId if possible (but show page usually only has one main item)
        // We'll trust the show page button logic for now if it's generic
        const mainWishlistBtn = document.getElementById('wishlist-btn');
        if (mainWishlistBtn && !mainWishlistBtn.hasAttribute('data-id')) {
            // Basic toggle for single view
            const icon = mainWishlistBtn.querySelector('i');
            if (isInWishlist) {
                if (icon) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                }
                mainWishlistBtn.classList.add('active');
            } else {
                if (icon) {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
                mainWishlistBtn.classList.remove('active');
            }
        }
    }
}

// Global function for onclick events
window.toggleWishlist = function (btn, listingId, type) {
    if (window.wishlistHandler) {
        window.wishlistHandler.toggleWishlist(listingId, type);
    } else {
        console.error('Wishlist handler not initialized');
    }
};

// Initialize globally
document.addEventListener('DOMContentLoaded', () => {
    window.wishlistHandler = new WishlistHandler();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WishlistHandler;
}
