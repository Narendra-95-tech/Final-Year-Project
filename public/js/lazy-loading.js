/**
 * Image Lazy Loading Utility
 * Add this script to enable lazy loading for all images
 */

document.addEventListener('DOMContentLoaded', function () {
  // Add loading="lazy" to all images that don't have it and are not small icons/avatars
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    // Skip very small images or transparent pixels if possible, but for simplicity, let's tag all
    img.setAttribute('loading', 'lazy');

    // If the image is already complete, mark it as loaded
    if (img.complete) {
      img.classList.add('lazy-loaded');
    }
  });

  // Intersection Observer for advanced lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;

          // Load high-res image if data-src is present
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }

          // Add loaded class for fade-in effect
          img.classList.add('lazy-loaded');

          // Stop observing this image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.01
    });

    // Observe all images with loading="lazy" or data-src
    const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
    lazyImages.forEach(img => {
      if (!img.classList.contains('lazy-loaded')) {
        imageObserver.observe(img);
      }
    });
  }

  // Preload critical images
  const criticalImages = document.querySelectorAll('img[data-priority="high"]');
  criticalImages.forEach(img => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = img.src;
    document.head.appendChild(link);
  });
});

// Add CSS for smooth fade-in
{
  const style = document.createElement('style');
  style.textContent = `
  img[loading="lazy"]:not(.lazy-loaded):not(.loaded) {
    opacity: 0;
    transition: opacity 0.3s ease-in;
  }
  
  img.lazy-loaded,
  img[loading="lazy"].loaded,
  img.loaded {
    opacity: 1 !important;
  }
  
  /* Placeholder while loading - only for images with data-src */
  img[data-src]:not(.lazy-loaded) {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: lazy-loading-skeleton 1.5s infinite;
  }
  
  @keyframes lazy-loading-skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
  document.head.appendChild(style);
}
