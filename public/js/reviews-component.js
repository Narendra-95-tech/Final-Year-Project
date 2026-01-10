/**
 * Reviews Component
 * Displays rating breakdown and individual reviews
 */

class ReviewsComponent {
  constructor(reviews, overallRating, listingId, currentUserId, itemType = 'listings') {
    this.reviews = reviews || [];
    this.overallRating = overallRating || 0;
    this.listingId = listingId;
    this.currentUserId = currentUserId;
    this.itemType = itemType;
    this.currentPage = 1;
    this.reviewsPerPage = 6;
  }

  calculateCategoryAverages() {
    if (this.reviews.length === 0) {
      return {
        cleanliness: 0,
        accuracy: 0,
        checkin: 0,
        communication: 0,
        location: 0,
        value: 0
      };
    }

    const totals = {
      cleanliness: 0,
      accuracy: 0,
      checkin: 0,
      communication: 0,
      location: 0,
      value: 0
    };

    let count = 0;
    this.reviews.forEach(review => {
      if (review.ratings) {
        totals.cleanliness += review.ratings.cleanliness || review.rating;
        totals.accuracy += review.ratings.accuracy || review.rating;
        totals.checkin += review.ratings.checkin || review.rating;
        totals.communication += review.ratings.communication || review.rating;
        totals.location += review.ratings.location || review.rating;
        totals.value += review.ratings.value || review.rating;
        count++;
      }
    });

    if (count === 0) count = 1;

    return {
      cleanliness: (totals.cleanliness / count).toFixed(1),
      accuracy: (totals.accuracy / count).toFixed(1),
      checkin: (totals.checkin / count).toFixed(1),
      communication: (totals.communication / count).toFixed(1),
      location: (totals.location / count).toFixed(1),
      value: (totals.value / count).toFixed(1)
    };
  }

  renderRatingBreakdown() {
    const averages = this.calculateCategoryAverages();

    const categories = [
      { key: 'cleanliness', label: 'Cleanliness' },
      { key: 'accuracy', label: 'Accuracy' },
      { key: 'checkin', label: 'Check-in' },
      { key: 'communication', label: 'Communication' },
      { key: 'location', label: 'Location' },
      { key: 'value', label: 'Value' }
    ];

    return `
      <div class="rating-grid-premium">
        ${categories.map(cat => `
          <div class="rating-category-premium">
            <span class="category-label-p">${cat.label}</span>
            <div class="category-value-group">
              <div class="rating-bar-container-p">
                <div class="rating-bar-fill-p" style="width: ${(averages[cat.key] / 5) * 100}%"></div>
              </div>
              <span class="category-score-p">${averages[cat.key]}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
  }

  renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star"></i>';
      } else if (i - 0.5 <= rating) {
        stars += '<i class="fas fa-star-half-alt"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }

  renderReviews() {
    const startIndex = (this.currentPage - 1) * this.reviewsPerPage;
    const endIndex = startIndex + this.reviewsPerPage;
    const paginatedReviews = this.reviews.slice(startIndex, endIndex);

    return `
      <div class="reviews-list">
        ${paginatedReviews.map(review => {
      // Check if current user is the author
      const reviewAuthorId = review.author && (review.author._id || review.author.id);
      const currentUserId = this.currentUserId;
      const isAuthor = currentUserId && reviewAuthorId && String(reviewAuthorId) === String(currentUserId);

      // Default avatar if missing
      const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.author?.username || 'User') + '&background=random';

      return `
          <div class="review-card fade-in">
            <div class="d-flex justify-content-between align-items-start">
              <div class="review-header">
                <img 
                  src="${review.author?.avatar?.url || defaultAvatar}" 
                  alt="${review.author?.username || 'User'}"
                  class="reviewer-avatar"
                  onerror="this.src='${defaultAvatar}'"
                />
                <div class="reviewer-info">
                  <div class="reviewer-name">${review.author?.username || 'Anonymous'}</div>
                  <div class="review-date">${this.formatDate(review.createdAt)}</div>
                </div>
              </div>
              
              ${isAuthor ? `
              <form class="ms-2 delete-review-form" method="POST" action="/${this.itemType}/${this.listingId}/reviews/${review._id}?_method=DELETE" onsubmit="return confirm('Are you sure you want to delete this review?');">
                <button class="btn btn-sm btn-link text-decoration-none text-danger p-0 delete-review-btn" title="Delete your review" style="opacity: 0.7; transition: opacity 0.2s;">
                  <span style="font-size: 0.9rem; font-weight: 500;">Delete</span> <i class="fas fa-trash-alt ms-1"></i>
                </button>
              </form>
              ` : ''}
            </div>
            
            <div class="review-rating">
              ${this.renderStars(review.rating)}
            </div>
            <p class="review-text">${review.comment}</p>
          </div>
        `}).join('')}
      </div>
      
      ${this.reviews.length > this.reviewsPerPage ? this.renderPagination() : ''}
    `;
  }

  renderPagination() {
    const totalPages = Math.ceil(this.reviews.length / this.reviewsPerPage);

    return `
      <div class="reviews-pagination" style="display: flex; justify-content: center; gap: 8px; margin-top: 24px;">
        <button 
          class="pagination-btn" 
          onclick="reviewsComponent.goToPage(${this.currentPage - 1})"
          ${this.currentPage === 1 ? 'disabled' : ''}
          style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer;"
        >
          Previous
        </button>
        
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
          <button 
            class="pagination-btn ${page === this.currentPage ? 'active' : ''}" 
            onclick="reviewsComponent.goToPage(${page})"
            style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; background: ${page === this.currentPage ? '#FF385C' : 'white'}; color: ${page === this.currentPage ? 'white' : '#222'}; cursor: pointer;"
          >
            ${page}
          </button>
        `).join('')}
        
        <button 
          class="pagination-btn" 
          onclick="reviewsComponent.goToPage(${this.currentPage + 1})"
          ${this.currentPage === totalPages ? 'disabled' : ''}
          style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer;"
        >
          Next
        </button>
      </div>
    `;
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.reviews.length / this.reviewsPerPage);
    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.updateReviewsDisplay();

    // Scroll to reviews section
    const reviewsSection = document.getElementById('reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateReviewsDisplay() {
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
      reviewsContainer.innerHTML = this.renderReviews();
    }
  }

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
      <div class="reviews-section-premium" id="reviews-section">
        <div class="reviews-summary-header">
          <div class="overall-rating-large">
            <i class="fas fa-star" style="color: var(--primary);"></i>
            <span>${this.overallRating.toFixed(1)}</span>
            <span class="dot-separator">·</span>
            <span class="reviews-count-large">${this.reviews.length} ${this.reviews.length === 1 ? 'review' : 'reviews'}</span>
          </div>
        </div>
        
        ${this.reviews.length > 0 ? this.renderRatingBreakdown() : ''}
        
        <div id="reviews-container" class="mt-5">
          ${this.reviews.length > 0 ? this.renderReviews() : '<div class="no-reviews-message-p">No reviews yet. Be the first to share your experience!</div>'}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewsComponent;
}
