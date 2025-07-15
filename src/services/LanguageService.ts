
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language files
import hi from '@/locales/hi.json';
import en from '@/locales/en.json';
import mr from '@/locales/mr.json';
import pa from '@/locales/pa.json';
import te from '@/locales/te.json';
import ta from '@/locales/ta.json';
import gu from '@/locales/gu.json';
import kn from '@/locales/kn.json';

export class LanguageService {
  private static instance: LanguageService;
  
  static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  async initialize(): Promise<void> {
    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources: {
          hi: { translation: hi },
          en: { translation: en },
          mr: { translation: mr },
          pa: { translation: pa },
          te: { translation: te },
          ta: { translation: ta },
          gu: { translation: gu },
          kn: { translation: kn },
        },
        fallbackLng: 'hi',
        debug: false,
        interpolation: {
          escapeValue: false,
        },
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
        },
      });
  }

  async changeLanguage(languageCode: string): Promise<void> {
    await i18n.changeLanguage(languageCode);
  }

  getCurrentLanguage(): string {
    return i18n.language;
  }

  translate(key: string, options?: any): string {
    const result = i18n.t(key, options);
    return typeof result === 'string' ? result : String(result);
  }

  getSupportedLanguages() {
    return [
      { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी' },
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    ];
  }
}
