/**
 * Image Gallery Component
 * Features: Carousel, fullscreen modal, thumbnails, swipe gestures
 */

class ImageGallery {
    constructor(containerId, images) {
        this.container = document.getElementById(containerId);
        this.images = images || [];
        this.currentIndex = 0;
        this.touchStartX = 0;
        this.touchEndX = 0;

        if (this.images.length > 0) {
            this.init();
        }
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.setupKeyboardNavigation();
    }

    render() {
        // Ensure we have at least 1 image
        const displayImages = this.images.length > 0 ? this.images : [{ url: '/images/default-listing.png', caption: '' }];

        // Limit to 5 for the grid (or fewer)
        const gridImages = displayImages.slice(0, 5);

        const html = `
      <div class="image-gallery-container">
        <div class="gallery-grid" id="gallery-grid-trigger">
          ${gridImages.map((img, index) => `
            <div class="gallery-grid-item">
              <img src="${img.url}" alt="${img.caption || 'Property image'}" class="gallery-grid-img" data-index="${index}">
            </div>
          `).join('')}
          
          <!-- Fill remaining slots if < 5 images to keep layout -->
          ${gridImages.length < 5 ?
                Array(5 - gridImages.length).fill(0).map(() => `
              <div class="gallery-grid-item" style="background: #f0f0f0;"></div>
            `).join('')
                : ''}
        </div>

        <button class="view-all-photos-btn" id="view-all-photos">
          <i class="fas fa-th"></i>
          <span>Show all photos</span>
        </button>
      </div>

      <!-- Fullscreen Modal (Existing structure) -->
      <div class="gallery-modal" id="gallery-modal">
        <button class="modal-close" id="modal-close">
          <i class="fas fa-times"></i>
        </button>
        <div class="modal-content">
          <img 
            src="${displayImages[this.currentIndex].url}" 
            alt="Fullscreen image"
            class="modal-image"
            id="modal-image"
          />
        </div>
        ${displayImages.length > 1 ? `
          <button class="gallery-nav gallery-nav-prev" id="modal-prev">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="gallery-nav gallery-nav-next" id="modal-next">
            <i class="fas fa-chevron-right"></i>
          </button>
        ` : ''}
        
        <div class="gallery-counter">
            ${this.currentIndex + 1} / ${displayImages.length}
        </div>
      </div>
    `;

        this.container.innerHTML = html;

        // Add separate listeners for grid items
        const gridTrigger = document.getElementById('gallery-grid-trigger');
        if (gridTrigger) {
            gridTrigger.addEventListener('click', () => this.openModal());
        }
    }

    attachEventListeners() {
        // Grid item clicks
        const gridItems = this.container.querySelectorAll('.gallery-grid-img');
        gridItems.forEach(img => {
            img.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentIndex = index;
                this.openModal();
            });
        });

        // View all photos button
        const viewAllBtn = document.getElementById('view-all-photos');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.currentIndex = 0;
                this.openModal();
            });
        }

        // Modal controls
        const modalClose = document.getElementById('modal-close');
        const modal = document.getElementById('gallery-modal');
        const modalPrev = document.getElementById('modal-prev');
        const modalNext = document.getElementById('modal-next');

        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.modal-content')) {
                    // Don't close if clicking image itself, but maybe allow closing if clicking background
                    if (e.target === modal) this.closeModal();
                }
            });
        }
        if (modalPrev) modalPrev.addEventListener('click', () => this.prev(true));
        if (modalNext) modalNext.addEventListener('click', () => this.next(true));

        // Touch/swipe support for modal
        if (modal) {
            modal.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            modal.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(true);
            }, { passive: true });
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('gallery-modal');
            const isModalOpen = modal && modal.classList.contains('active');

            if (!isModalOpen) return;

            if (e.key === 'ArrowLeft') {
                this.prev(true);
            } else if (e.key === 'ArrowRight') {
                this.next(true);
            } else if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    handleSwipe(isModal = false) {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.next(isModal);
            } else {
                this.prev(isModal);
            }
        }
    }

    next(isModal = false) {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateImage(isModal);
    }

    prev(isModal = false) {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateImage(isModal);
    }

    updateImage(isModal = false) {
        const modalImage = document.getElementById('modal-image');
        const counter = document.querySelector('.gallery-counter');

        if (modalImage && isModal) {
            // Add fade-in effect for image change
            modalImage.style.opacity = '0';
            setTimeout(() => {
                modalImage.src = this.images[this.currentIndex].url;
                modalImage.alt = this.images[this.currentIndex].caption || 'Property image';
                modalImage.style.opacity = '1';
            }, 150);
        }

        if (counter) {
            counter.innerHTML = `<span class="current-idx">${this.currentIndex + 1}</span> / ${this.images.length}`;
        }
    }

    openModal() {
        const modal = document.getElementById('gallery-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.updateImage(true);

            // GSAP-like entrance animation (CSS handled)
        }
    }

    closeModal() {
        const modal = document.getElementById('gallery-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Lazy loading for images
    lazyLoadImages() {
        const images = document.querySelectorAll('.gallery-image, .gallery-thumbnail');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageGallery;
}
