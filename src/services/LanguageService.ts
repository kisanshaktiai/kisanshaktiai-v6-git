
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
import bn from '@/locales/bn.json';
import ml from '@/locales/ml.json';
import or from '@/locales/or.json';
import ur from '@/locales/ur.json';

export class LanguageService {
  private static instance: LanguageService;
  private rtlLanguages = ['ur', 'ar'];
  
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
          bn: { translation: bn },
          ml: { translation: ml },
          or: { translation: or },
          ur: { translation: ur },
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

    // Set initial document direction
    this.setDocumentDirection(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', (language) => {
      this.setDocumentDirection(language);
    });
  }

  private setDocumentDirection(language: string): void {
    const isRTL = this.isRTLLanguage(language);
    
    // Set document direction
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

    // Apply font-specific classes
    this.applyLanguageFont(language);
  }

  private applyLanguageFont(language: string): void {
    // Remove existing font classes
    document.body.classList.remove('font-devanagari', 'font-bengali', 'font-malayalam', 'font-odia', 'font-urdu');
    
    // Apply appropriate font class
    switch (language) {
      case 'hi':
      case 'mr':
        document.body.classList.add('font-devanagari');
        break;
      case 'bn':
        document.body.classList.add('font-bengali');
        break;
      case 'ml':
        document.body.classList.add('font-malayalam');
        break;
      case 'or':
        document.body.classList.add('font-odia');
        break;
      case 'ur':
        document.body.classList.add('font-urdu');
        break;
      default:
        // Default to system font for other languages
        break;
    }
  }

  async changeLanguage(languageCode: string): Promise<void> {
    await i18n.changeLanguage(languageCode);
    this.setDocumentDirection(languageCode);
  }

  getCurrentLanguage(): string {
    return i18n.language;
  }

  translate(key: string, options?: any): string {
    const result = i18n.t(key, options);
    return typeof result === 'string' ? result : String(result);
  }

  isRTLLanguage(languageCode: string): boolean {
    return this.rtlLanguages.includes(languageCode);
  }

  getCurrentDirection(): 'ltr' | 'rtl' {
    return this.isRTLLanguage(this.getCurrentLanguage()) ? 'rtl' : 'ltr';
  }

  getSupportedLanguages() {
    return [
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', isRTL: false },
      { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isRTL: false },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', isRTL: false },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', isRTL: false },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isRTL: false },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', isRTL: false },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', isRTL: false },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isRTL: false },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', isRTL: false },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', isRTL: false },
      { code: 'ur', name: 'Urdu', nativeName: 'اُردُو', isRTL: true },
    ];
  }

  getLanguageConfig(languageCode: string) {
    const language = this.getSupportedLanguages().find(lang => lang.code === languageCode);
    return {
      ...language,
      direction: language?.isRTL ? 'rtl' : 'ltr',
      fontClass: this.getFontClass(languageCode)
    };
  }

  private getFontClass(languageCode: string): string {
    switch (languageCode) {
      case 'hi':
      case 'mr':
        return 'font-devanagari';
      case 'bn':
        return 'font-bengali';
      case 'ml':
        return 'font-malayalam';
      case 'or':
        return 'font-odia';
      case 'ur':
        return 'font-urdu';
      default:
        return '';
    }
  }
}
