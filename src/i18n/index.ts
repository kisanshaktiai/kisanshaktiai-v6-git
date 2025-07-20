
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
  },
  pa: {
    translation: paTranslations,
  },
  te: {
    translation: teTranslations,
  },
  ta: {
    translation: taTranslations,
  },
  gu: {
    translation: guTranslations,
  },
  kn: {
    translation: knTranslations,
  },
  bn: {
    translation: bnTranslations,
  },
  ml: {
    translation: mlTranslations,
  },
  or: {
    translation: orTranslations,
  },
  ur: {
    translation: urTranslations,
  },
};

// RTL languages list
const rtlLanguages = ['ur', 'ar'];

// Function to set document direction based on language
const setDocumentDirection = (language: string) => {
  const isRTL = rtlLanguages.includes(language);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', language);
  
  // Add language-specific class to body
  document.body.className = document.body.className.replace(/lang-\w+/g, '');
  document.body.classList.add(`lang-${language}`);
  
  // Apply RTL-specific styles
  if (isRTL) {
    document.body.classList.add('rtl-layout');
  } else {
    document.body.classList.remove('rtl-layout');
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

// Set initial direction
setDocumentDirection(i18n.language);

// Listen for language changes
i18n.on('languageChanged', (language) => {
  setDocumentDirection(language);
});

export default i18n;
