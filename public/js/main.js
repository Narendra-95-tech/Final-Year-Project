// Main JavaScript file for WanderLust

// Initialize components when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('WanderLust main.js loaded');

    // Initialize dark mode if the function exists
    if (typeof initializeDarkMode === 'function') {
        initializeDarkMode();
    }

    // Initialize language manager if it exists
    if (typeof languageManager !== 'undefined') {
        languageManager.initialize();
    }

    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }
});

// Dark mode functionality
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Check for saved user preference, if any
        const savedMode = localStorage.getItem('darkMode') === 'true';
        if (savedMode) {
            document.body.classList.add('dark-mode');
        }

        // Toggle dark/light mode
        darkModeToggle.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);

            // Update icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            }

            // Dispatch theme change event for maps and other components
            window.dispatchEvent(new CustomEvent('wanderlust:themeChange', {
                detail: { isDarkMode }
            }));
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDarkMode
    };
}
