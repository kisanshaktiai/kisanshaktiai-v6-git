
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import mrTranslations from '../locales/mr.json';
import paTranslations from '../locales/pa.json';
import teTranslations from '../locales/te.json';
import taTranslations from '../locales/ta.json';
import guTranslations from '../locales/gu.json';
import knTranslations from '../locales/kn.json';
import bnTranslations from '../locales/bn.json';
import mlTranslations from '../locales/ml.json';
import orTranslations from '../locales/or.json';
import urTranslations from '../locales/ur.json';
import dashboardEn from '../locales/dashboard-en.json';
import dashboardHi from '../locales/dashboard-hi.json';

const resources = {
  en: {
    translation: enTranslations,
    dashboard: dashboardEn,
  },
  hi: {
    translation: hiTranslations,
    dashboard: dashboardHi,
  },
  mr: {
    translation: mrTranslations,
    dashboard: {}, // Add empty dashboard namespace for other languages
  },
  pa: {
    translation: paTranslations,
    dashboard: {},
  },
  te: {
    translation: teTranslations,
    dashboard: {},
  },
  ta: {
    translation: taTranslations,
    dashboard: {},
  },
  gu: {
    translation: guTranslations,
    dashboard: {},
  },
  kn: {
    translation: knTranslations,
    dashboard: {},
  },
  bn: {
    translation: bnTranslations,
    dashboard: {},
  },
  ml: {
    translation: mlTranslations,
    dashboard: {},
  },
  or: {
    translation: orTranslations,
    dashboard: {},
  },
  ur: {
    translation: urTranslations,
    dashboard: {},
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    fallbackNS: 'translation',
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
    // Enable real-time updates
    saveMissing: false,
    updateMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}, namespace: ${ns}`);
      return key; // Return the key itself as fallback
    },
    // Load all namespaces
    ns: ['translation', 'dashboard'],
    // Preload all supported languages for instant switching
    preload: ['en', 'hi', 'mr'],
    // Ensure keys are properly interpolated
    returnEmptyString: false,
    returnNull: false,
  });

export default i18n;
