
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
    dashboard: dashboardEn, // Use English dashboard as fallback
  },
  pa: {
    translation: paTranslations,
    dashboard: dashboardEn,
  },
  te: {
    translation: teTranslations,
    dashboard: dashboardEn,
  },
  ta: {
    translation: taTranslations,
    dashboard: dashboardEn,
  },
  gu: {
    translation: guTranslations,
    dashboard: dashboardEn,
  },
  kn: {
    translation: knTranslations,
    dashboard: dashboardEn,
  },
  bn: {
    translation: bnTranslations,
    dashboard: dashboardEn,
  },
  ml: {
    translation: mlTranslations,
    dashboard: dashboardEn,
  },
  or: {
    translation: orTranslations,
    dashboard: dashboardEn,
  },
  ur: {
    translation: urTranslations,
    dashboard: dashboardEn,
  },
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
    preload: ['en', 'hi'],
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
