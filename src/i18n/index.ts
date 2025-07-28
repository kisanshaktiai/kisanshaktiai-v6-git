
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Core translations - loaded immediately
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import dashboardEn from '../locales/dashboard-en.json';
import dashboardHi from '../locales/dashboard-hi.json';

// Language loader for lazy loading
const loadLanguage = async (languageCode: string) => {
  try {
    switch (languageCode) {
      case 'mr':
        return (await import('../locales/mr.json')).default;
      case 'pa':
        return (await import('../locales/pa.json')).default;
      case 'te':
        return (await import('../locales/te.json')).default;
      case 'ta':
        return (await import('../locales/ta.json')).default;
      case 'gu':
        return (await import('../locales/gu.json')).default;
      case 'kn':
        return (await import('../locales/kn.json')).default;
      case 'bn':
        return (await import('../locales/bn.json')).default;
      case 'ml':
        return (await import('../locales/ml.json')).default;
      case 'or':
        return (await import('../locales/or.json')).default;
      case 'ur':
        return (await import('../locales/ur.json')).default;
      default:
        console.warn(`Language ${languageCode} not supported`);
        return null;
    }
  } catch (error) {
    console.error(`Failed to load language ${languageCode}:`, error);
    return null;
  }
};

// Initial resources with core languages only
const resources = {
  en: {
    translation: enTranslations,
    dashboard: dashboardEn,
  },
  hi: {
    translation: hiTranslations,
    dashboard: dashboardHi,
  },
};

// Enhanced language loader with caching
export const loadLanguageResources = async (languageCode: string) => {
  // Skip if already loaded
  if (resources[languageCode as keyof typeof resources]) {
    return true;
  }

  console.log(`🌐 Lazy loading language: ${languageCode}`);
  
  // Check cache first
  const cacheKey = `i18n_${languageCode}`;
  const cached = localStorage.getItem(cacheKey);
  
  let translations;
  if (cached) {
    try {
      translations = JSON.parse(cached);
      console.log(`📦 Loaded ${languageCode} from cache`);
    } catch (error) {
      console.warn(`Failed to parse cached translations for ${languageCode}:`, error);
    }
  }

  // Load from network if not cached
  if (!translations) {
    translations = await loadLanguage(languageCode);
    if (translations) {
      // Cache the translations
      try {
        localStorage.setItem(cacheKey, JSON.stringify(translations));
        console.log(`💾 Cached translations for ${languageCode}`);
      } catch (error) {
        console.warn(`Failed to cache translations for ${languageCode}:`, error);
      }
    }
  }

  if (translations) {
    // Add to i18n resources
    i18n.addResources(languageCode, 'translation', translations);
    i18n.addResources(languageCode, 'dashboard', dashboardEn); // Fallback to English dashboard
    
    // Update local resources object
    (resources as any)[languageCode] = {
      translation: translations,
      dashboard: dashboardEn,
    };
    
    console.log(`✅ Language ${languageCode} loaded successfully`);
    return true;
  }

  return false;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    fallbackNS: ['translation', 'dashboard'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    },
    saveMissing: false,
    updateMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}, namespace: ${ns}`);
      }
      // Return the key's last part or fallback value for better UX
      return fallbackValue || key.split('.').pop() || key;
    },
    ns: ['translation', 'dashboard'],
    preload: ['en', 'hi'], // Only preload core languages
    partialBundledLanguages: true, // Enable partial bundling for lazy loading
    returnEmptyString: false,
    returnNull: false,
    keySeparator: '.',
    nsSeparator: ':',
    debug: process.env.NODE_ENV === 'development',
    // Add postProcess to handle missing translations gracefully
    postProcess: ['fallback'],
    // Enable strict mode to catch translation issues early
    parseMissingKeyHandler: (key) => {
      if (process.env.NODE_ENV === 'development') {
        return `[MISSING: ${key}]`;
      }
      return key.split('.').pop() || key;
    }
  });

export default i18n;
