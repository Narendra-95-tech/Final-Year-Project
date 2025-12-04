// Language Manager - Handles language switching and RTL support
class LanguageManager {
  constructor() {
    this.currentLanguage = this.getSavedLanguage();
    this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    this.initialize();
  }

  // Initialize language manager
  initialize() {
    this.setupEventListeners();
    this.applyLanguage(this.currentLanguage);
  }

  // Get saved language from localStorage or browser settings
  getSavedLanguage() {
    return (
      localStorage.getItem('wanderlust_language') ||
      navigator.language.split('-')[0] ||
      'en'
    );
  }

  // Save language preference
  saveLanguage(lang) {
    localStorage.setItem('wanderlust_language', lang);
    document.cookie = `wanderlust_language=${lang};path=/;max-age=31536000`; // 1 year
  }

  // Apply language to the page
  applyLanguage(lang) {
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    this.currentLanguage = lang;
    this.saveLanguage(lang);

    // Update RTL if needed
    this.updateRTL(this.isRTL(lang));

    // Update all translatable elements
    this.updateTranslations();

    // Update active language in the dropdown
    this.updateActiveLanguageIndicator(lang);

    // Dispatch language change event
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }

  // Check if language is RTL
  isRTL(lang) {
    return this.rtlLanguages.includes(lang);
  }

  // Update RTL styling
  updateRTL(isRTL) {
    if (isRTL) {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl');
    }
  }

  // Update all translatable elements
  updateTranslations() {
    // This will be populated with translations from the server
    // For now, we'll use the data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const translation = this.getTranslation(key, this.currentLanguage);
        if (translation) {
          if (element.tagName === 'INPUT' && element.type === 'text' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
          } else if (element.hasAttribute('title')) {
            element.title = translation;
          } else if (element.hasAttribute('alt')) {
            element.alt = translation;
          } else if (element.hasAttribute('value')) {
            element.value = translation;
          } else {
            element.textContent = translation;
          }
        }
      }
    });
  }

  // Translation dictionary
  getTranslations(lang) {
    const translations = {
      // Navigation
      'nav.home': { en: 'Home', hi: 'होम', es: 'Inicio', fr: 'Accueil', ar: 'الرئيسية' },
      'nav.listings': { en: 'Listings', hi: 'सूची', es: 'Listados', fr: 'Annonces', ar: 'القوائم' },
      'nav.vehicles': { en: 'Vehicles', hi: 'वाहन', es: 'Vehículos', fr: 'Véhicules', ar: 'المركبات' },
      'nav.dhabas': { en: 'Dhabas', hi: 'ढाबे', es: 'Dhabas', fr: 'Dhabas', ar: 'مطاعم' },
      'nav.community': { en: 'Community', hi: 'समुदाय', es: 'Comunidad', fr: 'Communauté', ar: 'المجتمع' },
      'nav.travel_journal': { en: 'Travel Journal', hi: 'यात्रा पत्रिका', es: 'Diario de viaje', fr: 'Journal de voyage', ar: 'يوميات السفر' },
      'nav.photo_gallery': { en: 'Photo Gallery', hi: 'तस्वीर गैलरी', es: 'Galería de fotos', fr: 'Galerie photo', ar: 'معرض الصور' },
      'nav.reviews': { en: 'Reviews', hi: 'समीक्षाएं', es: 'Reseñas', fr: 'Avis', ar: 'التعليقات' },
      'nav.settings': { en: 'Settings', hi: 'सेटिंग्स', es: 'Configuración', fr: 'Paramètres', ar: 'الإعدادات' },
      'nav.profile': { en: 'Profile', hi: 'प्रोफ़ाइल', es: 'Perfil', fr: 'Profil', ar: 'الملف الشخصي' },
      'nav.logout': { en: 'Logout', hi: 'लॉग आउट', es: 'Cerrar sesión', fr: 'Déconnexion', ar: 'تسجيل خروج' },
      'nav.signup': { en: 'Sign up', hi: 'साइन अप करें', es: 'Registrarse', fr: 'S\'inscrire', ar: 'اشتراك' },
      'nav.login': { en: 'Log in', hi: 'लॉग इन', es: 'Iniciar sesión', fr: 'Connexion', ar: 'تسجيل الدخول' },
      'nav.search_placeholder': { en: 'Search stays, vehicles, dhabas...', hi: 'स्टे, वाहन, ढाबे खोजें...', es: 'Buscar alojamientos, vehículos, dhabas...', fr: 'Rechercher des hébergements, véhicules, dhabas...', ar: 'ابحث عن أماكن الإقامة والمركبات والمطاعم...' },
      
      // Language Selector
      'language': { en: 'Language', hi: 'भाषा', es: 'Idioma', fr: 'Langue', ar: 'اللغة' },
      
      // Common
      'close': { en: 'Close', hi: 'बंद करें', es: 'Cerrar', fr: 'Fermer', ar: 'إغلاق' },
      'loading': { en: 'Loading...', hi: 'लोड हो रहा है...', es: 'Cargando...', fr: 'Chargement...', ar: 'جاري التحميل...' },
      'error': { en: 'Error', hi: 'त्रुटि', es: 'Error', fr: 'Erreur', ar: 'خطأ' },
      'success': { en: 'Success', hi: 'सफलता', es: 'Éxito', fr: 'Succès', ar: 'نجاح' }
    };
    
    return translations;
  }

  // Get translation for a key
  getTranslation(key, lang) {
    const translations = this.getTranslations(lang);
    const defaultLang = 'en';
    
    if (translations[key]) {
      // Return translation for the requested language, fallback to English
      return translations[key][lang] || translations[key][defaultLang] || key;
    }
    
    // If key not found, return the key itself
    return key;
  }

  // Update active language indicator in the dropdown
  updateActiveLanguageIndicator(lang) {
    document.querySelectorAll('[data-lang]').forEach(item => {
      const icon = item.querySelector('.fa-check');
      if (item.getAttribute('data-lang') === lang) {
        item.classList.add('active');
        if (icon) icon.style.display = 'block';
      } else {
        item.classList.remove('active');
        if (icon) icon.style.display = 'none';
      }
    });
  }

  // Set up event listeners
  setupEventListeners() {
    // Language selector dropdown items
    document.addEventListener('click', (e) => {
      const langItem = e.target.closest('[data-lang]');
      if (langItem) {
        e.preventDefault();
        const lang = langItem.getAttribute('data-lang');
        this.applyLanguage(lang);
      }
    });

    // Listen for language change events from other components
    document.addEventListener('languageChangeRequested', (e) => {
      if (e.detail && e.detail.language) {
        this.applyLanguage(e.detail.language);
      }
    });
  }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.languageManager = new LanguageManager();
  
  // Add language selector to mobile menu if it exists
  const mobileMenu = document.querySelector('.mobile-menu');
  const languageSelector = document.querySelector('.language-selector');
  
  if (mobileMenu && languageSelector) {
    const clone = languageSelector.cloneNode(true);
    clone.classList.add('mt-3', 'px-3');
    mobileMenu.appendChild(clone);
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageManager;
}
