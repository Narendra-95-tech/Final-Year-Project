// Supported languages with their display names and flags
const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  hi: { name: 'हिंदी', flag: '🇮🇳' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  ar: { name: 'العربية', flag: '🇸🇦' },
  zh: { name: '中文', flag: '🇨🇳' },
  ja: { name: '日本語', flag: '🇯🇵' },
  de: { name: 'Deutsch', flag: '🇩🇪' }
};

// Translation strings for different languages
const TRANSLATIONS = {
  // Common UI Elements
  'bookNow': {
    en: 'Book Now',
    hi: 'अभी बुक करें',
    es: 'Reservar ahora',
    fr: 'Réserver',
    ar: 'احجز الآن',
    zh: '立即预订',
    ja: '今すぐ予約',
    de: 'Jetzt buchen'
  },
  'perNight': {
    en: 'night',
    hi: 'रात',
    es: 'noche',
    fr: 'nuit',
    ar: 'ليلة',
    zh: '晚',
    ja: '泊',
    de: 'Nacht'
  },
  'guests': {
    en: 'Guests',
    hi: 'मेहमान',
    es: 'Huéspedes',
    fr: 'Voyageurs',
    ar: 'الضيوف',
    zh: '房客',
    ja: 'ゲスト',
    de: 'Gäste'
  },
  'checkIn': {
    en: 'Check-in',
    hi: 'चेक-इन',
    es: 'Llegada',
    fr: 'Arrivée',
    ar: 'تسجيل الوصول',
    zh: '入住',
    ja: 'チェックイン',
    de: 'Anreise'
  },
  'checkOut': {
    en: 'Check-out',
    hi: 'चेक आउट',
    es: 'Salida',
    fr: 'Départ',
    ar: 'تسجيل الخروج',
    zh: '退房',
    ja: 'チェックアウト',
    de: 'Abreise'
  },
  'search': {
    en: 'Search',
    hi: 'खोजें',
    es: 'Buscar',
    fr: 'Rechercher',
    ar: 'بحث',
    zh: '搜索',
    ja: '検索',
    de: 'Suchen'
  },
  
  // Listing Details
  'amenities': {
    en: 'Amenities',
    hi: 'सुविधाएं',
    es: 'Comodidades',
    fr: 'Équipements',
    ar: 'وسائل الراحة',
    zh: '设施',
    ja: '設備・アメニティ',
    de: 'Ausstattung'
  },
  'reviews': {
    en: 'Reviews',
    hi: 'समीक्षाएं',
    es: 'Reseñas',
    fr: 'Avis',
    ar: 'التقييمات',
    zh: '评价',
    ja: 'レビュー',
    de: 'Bewertungen'
  },
  'location': {
    en: 'Location',
    hi: 'स्थान',
    es: 'Ubicación',
    fr: 'Lieu',
    ar: 'الموقع',
    zh: '位置',
    ja: 'ロケーション',
    de: 'Lage'
  },
  
  // Booking Form
  'selectDates': {
    en: 'Select dates',
    hi: 'तारीख चुनें',
    es: 'Seleccionar fechas',
    fr: 'Sélectionner les dates',
    ar: 'حدد التواريخ',
    zh: '选择日期',
    ja: '日付を選択',
    de: 'Daten auswählen'
  },
  'addGuests': {
    en: 'Add guests',
    hi: 'मेहमान जोड़ें',
    es: 'Añadir huéspedes',
    fr: 'Ajouter des voyageurs',
    ar: 'إضافة ضيوف',
    zh: '添加入住人数',
    ja: '宿泊人数を追加',
    de: 'Gäste hinzufügen'
  },
  'total': {
    en: 'Total',
    hi: 'कुल',
    es: 'Total',
    fr: 'Total',
    ar: 'المجموع',
    zh: '总计',
    ja: '合計',
    de: 'Gesamt'
  },
  'nights': {
    en: 'nights',
    hi: 'रातें',
    es: 'noches',
    fr: 'nuits',
    ar: 'ليالي',
    zh: '晚',
    ja: '泊',
    de: 'Nächte'
  },
  'serviceFee': {
    en: 'Service fee',
    hi: 'सेवा शुल्क',
    es: 'Tarifa de servicio',
    fr: 'Frais de service',
    ar: 'رسوم الخدمة',
    zh: '服务费',
    ja: 'サービス料',
    de: 'Servicegebühr'
  },
  'cleaningFee': {
    en: 'Cleaning fee',
    hi: 'सफाई शुल्क',
    es: 'Tarifa de limpieza',
    fr: 'Frais de ménage',
    ar: 'رسوم التنظيف',
    zh: '清洁费',
    ja: '清掃料金',
    de: 'Reinigungspauschale'
  },
  'taxes': {
    en: 'Taxes',
    hi: 'कर',
    es: 'Impuestos',
    fr: 'Taxes',
    ar: 'الضرائب',
    zh: '税费',
    ja: '税金',
    de: 'Steuern'
  },
  
  // Navigation
  'home': {
    en: 'Home',
    hi: 'होम',
    es: 'Inicio',
    fr: 'Accueil',
    ar: 'الرئيسية',
    zh: '首页',
    ja: 'ホーム',
    de: 'Startseite'
  },
  'explore': {
    en: 'Explore',
    hi: 'एक्सप्लोर करें',
    es: 'Explorar',
    fr: 'Explorer',
    ar: 'استكشف',
    zh: '探索',
    ja: '探す',
    de: 'Entdecken'
  },
  'trips': {
    en: 'Trips',
    hi: 'यात्राएं',
    es: 'Viajes',
    fr: 'Voyages',
    ar: 'رحلات',
    zh: '旅程',
    ja: '旅',
    de: 'Reisen'
  },
  'inbox': {
    en: 'Inbox',
    hi: 'इनबॉक्स',
    es: 'Bandeja de entrada',
    fr: 'Messages',
    ar: 'الرسائل',
    zh: '收件箱',
    ja: 'メッセージ',
    de: 'Posteingang'
  },
  'profile': {
    en: 'Profile',
    hi: 'प्रोफ़ाइल',
    es: 'Perfil',
    fr: 'Profil',
    ar: 'الملف الشخصي',
    zh: '个人资料',
    ja: 'プロフィール',
    de: 'Profil'
  },
  
  // Authentication
  'login': {
    en: 'Log In',
    hi: 'लॉग इन',
    es: 'Iniciar sesión',
    fr: 'Connexion',
    ar: 'تسجيل الدخول',
    zh: '登录',
    ja: 'ログイン',
    de: 'Anmelden'
  },
  'signup': {
    en: 'Sign Up',
    hi: 'साइन अप',
    es: 'Registrarse',
    fr: 'S\'inscrire',
    ar: 'إنشاء حساب',
    zh: '注册',
    ja: '登録',
    de: 'Registrieren'
  },
  'logout': {
    en: 'Log Out',
    hi: 'लॉग आउट',
    es: 'Cerrar sesión',
    fr: 'Déconnexion',
    ar: 'تسجيل الخروج',
    zh: '退出登录',
    ja: 'ログアウト',
    de: 'Abmelden'
  },
  
  // Search Filters
  'anyPrice': {
    en: 'Any price',
    hi: 'कोई भी कीमत',
    es: 'Cualquier precio',
    fr: 'Tous les prix',
    ar: 'أي سعر',
    zh: '任何价格',
    ja: '価格を問わず',
    de: 'Jeder Preis'
  },
  'filters': {
    en: 'Filters',
    hi: 'फ़िल्टर',
    es: 'Filtros',
    fr: 'Filtres',
    ar: 'المرشحات',
    zh: '筛选条件',
    ja: 'フィルター',
    de: 'Filter'
  },
  'clear': {
    en: 'Clear',
    hi: 'साफ़ करें',
    es: 'Borrar',
    fr: 'Effacer',
    ar: 'مسح',
    zh: '清除',
    ja: 'クリア',
    de: 'Löschen'
  },
  'apply': {
    en: 'Apply',
    hi: 'लागू करें',
    es: 'Aplicar',
    fr: 'Appliquer',
    ar: 'تطبيق',
    zh: '应用',
    ja: '適用',
    de: 'Anwenden'
  }
};

// RTL languages configuration
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Function to get translation for a key in the current language
function t(key, lang = 'en') {
  if (!TRANSLATIONS[key]) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en'] || key;
}

// Function to check if a language is RTL
function isRTL(lang) {
  return RTL_LANGUAGES.includes(lang);
}

// Function to update the language of the page
function updatePageLanguage(lang) {
  // Update html lang attribute
  document.documentElement.lang = lang;
  
  // Update RTL if needed
  if (isRTL(lang)) {
    document.documentElement.dir = 'rtl';
    document.body.classList.add('rtl');
  } else {
    document.documentElement.dir = 'ltr';
    document.body.classList.remove('rtl');
  }
  
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = t(key, lang);
      
      // For input placeholders
      if (element.placeholder) {
        element.placeholder = t(key, lang);
      }
      
      // For alt text
      if (element.alt) {
        element.alt = t(key, lang);
      }
      
      // For title attributes
      if (element.title) {
        element.title = t(key, lang);
      }
    }
  });
  
  // Update language selector
  const languageSelect = document.getElementById('language-selector');
  if (languageSelect) {
    languageSelect.value = lang;
  }
  
  // Save language preference
  localStorage.setItem('preferredLanguage', lang);
  document.cookie = `lang=${lang};path=/;max-age=${60*60*24*365}`; // 1 year
  
  // Dispatch language change event
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

// Function to initialize language selector
document.addEventListener('DOMContentLoaded', () => {
  // Create language selector if it doesn't exist
  if (!document.getElementById('language-selector')) {
    const header = document.querySelector('header') || document.body;
    const languageSelector = document.createElement('div');
    languageSelector.className = 'language-selector';
    languageSelector.innerHTML = `
      <select id="language-selector" class="form-select form-select-sm" aria-label="Select language">
        ${Object.entries(SUPPORTED_LANGUAGES)
          .map(([code, { name, flag }]) => 
            `<option value="${code}">${flag} ${name}</option>`)
          .join('')}
      </select>
    `;
    header.prepend(languageSelector);
    
    // Add event listener for language change
    document.getElementById('language-selector').addEventListener('change', (e) => {
      updatePageLanguage(e.target.value);
    });
  }
  
  // Set initial language
  const savedLanguage = localStorage.getItem('preferredLanguage') || 
                       document.documentElement.lang || 
                       navigator.language.split('-')[0];
  
  updatePageLanguage(SUPPORTED_LANGUAGES[savedLanguage] ? savedLanguage : 'en');
});

// Export for use in other modules
export { 
  SUPPORTED_LANGUAGES, 
  TRANSLATIONS, 
  t as translate, 
  updatePageLanguage, 
  isRTL 
};
