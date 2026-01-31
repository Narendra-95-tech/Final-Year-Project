/**
 * Mobile Navigation JavaScript
 * Handles mobile menu, bottom nav, and mobile-specific interactions
 */

(function () {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNav);
    } else {
        initMobileNav();
    }

    function initMobileNav() {
        // Mobile menu toggle
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const menuOverlay = document.querySelector('.mobile-menu-overlay');
        const menu = document.querySelector('.mobile-menu');
        const menuClose = document.querySelector('.mobile-menu-close');

        if (menuBtn && menu && menuOverlay) {
            menuBtn.addEventListener('click', openMobileMenu);
            menuClose?.addEventListener('click', closeMobileMenu);
            menuOverlay.addEventListener('click', closeMobileMenu);
        }

        // Set active nav item based on current page
        setActiveNavItem();

        // Add smooth scroll for mobile
        if (window.innerWidth <= 768) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
    }

    function openMobileMenu() {
        const menu = document.querySelector('.mobile-menu');
        const overlay = document.querySelector('.mobile-menu-overlay');

        menu?.classList.add('active');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function closeMobileMenu() {
        const menu = document.querySelector('.mobile-menu');
        const overlay = document.querySelector('.mobile-menu-overlay');

        menu?.classList.remove('active');
        overlay?.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }

    function setActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.mobile-nav-item');

        // Remove active class from all items first
        navItems.forEach(item => item.classList.remove('active'));

        // Find best match
        let bestMatch = null;
        let bestMatchLength = 0;

        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (!href) return;

            // Exact match
            if (href === currentPath) {
                bestMatch = item;
                bestMatchLength = href.length;
            }
            // Partial match (for nested routes)
            else if (href !== '/' && currentPath.startsWith(href) && href.length > bestMatchLength) {
                bestMatch = item;
                bestMatchLength = href.length;
            }
            // Home page
            else if (href === '/' && currentPath === '/' && !bestMatch) {
                bestMatch = item;
            }
        });

        // Apply active class to best match
        if (bestMatch) {
            bestMatch.classList.add('active');
        }
    }

    // Update notification badge
    window.updateMobileNavBadge = function (navItem, count) {
        const item = document.querySelector(`.mobile-nav-item[data-nav="${navItem}"]`);
        if (!item) return;

        let badge = item.querySelector('.mobile-nav-badge');

        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'mobile-nav-badge';
                item.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            badge?.remove();
        }
    };

    // Expose close menu function globally
    window.closeMobileMenu = closeMobileMenu;

})();
