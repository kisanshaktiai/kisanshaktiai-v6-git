
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
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  pa: {
    translation: paTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  te: {
    translation: teTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  ta: {
    translation: taTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  gu: {
    translation: guTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  kn: {
    translation: knTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  bn: {
    translation: bnTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  ml: {
    translation: mlTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  or: {
    translation: orTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
  },
  ur: {
    translation: urTranslations,
    dashboard: dashboardEn, // Use English dashboard as fallback for now
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
    // Enable real-time updates and better error handling
    saveMissing: false,
    updateMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}, namespace: ${ns}`);
      }
      // Return a more readable fallback instead of just the key
      return fallbackValue || key.split('.').pop() || key;
    },
    // Load all namespaces
    ns: ['translation', 'dashboard'],
    // Preload supported languages for instant switching
    preload: ['en', 'hi'],
    // Ensure keys are properly interpolated
    returnEmptyString: false,
    returnNull: false,
    // Add key separator for nested keys
    keySeparator: '.',
    nsSeparator: ':',
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;
