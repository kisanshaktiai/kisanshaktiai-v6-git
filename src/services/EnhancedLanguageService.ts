import { LanguageService } from './LanguageService';
import { LocationService } from './LocationService';
import { LanguageConfigService, LanguageInfo } from '@/config/languages';

export interface LanguagePreferences {
  recentLanguages: string[];
  preferredLanguage: string;
  autoDetect: boolean;
  locationBased: boolean;
}

export class EnhancedLanguageService {
  private static instance: EnhancedLanguageService;
  private languageService: LanguageService;
  private locationService: LocationService;
  private preferences: LanguagePreferences;

  static getInstance(): EnhancedLanguageService {
    if (!this.instance) {
      this.instance = new EnhancedLanguageService();
    }
    return this.instance;
  }

  constructor() {
    this.languageService = LanguageService.getInstance();
    this.locationService = LocationService.getInstance();
    this.preferences = this.loadPreferences();
  }

  async detectBestLanguage(): Promise<{
    recommended: LanguageInfo[];
    deviceLanguage?: string;
    locationState?: string;
  }> {
    try {
      // Get device/browser language
      const deviceLanguage = this.detectDeviceLanguage();
      
      // Get location-based recommendations
      let locationState: string | undefined;
      let recommended: LanguageInfo[] = [];

      if (this.preferences.locationBased) {
        try {
          const location = await this.locationService.getCurrentLocation();
          const addressInfo = await this.locationService.reverseGeocode(
            location.latitude,
            location.longitude
          );
          locationState = addressInfo.state;
        } catch (error) {
          console.warn('Failed to get location for language detection:', error);
        }
      }

      // Get recommendations
      recommended = LanguageConfigService.getRecommendedLanguages(locationState, deviceLanguage);

      // Add recent languages to the top
      const recentLangs = this.preferences.recentLanguages
        .map(code => LanguageConfigService.getLanguageByCode(code))
        .filter(Boolean) as LanguageInfo[];

      // Merge recent with recommended (avoid duplicates)
      const allRecommended = [
        ...recentLangs,
        ...recommended.filter(r => !recentLangs.find(recent => recent.code === r.code))
      ];

      return {
        recommended: allRecommended,
        deviceLanguage,
        locationState
      };
    } catch (error) {
      console.error('Language detection failed:', error);
      // Return fallback recommendations
      return {
        recommended: LanguageConfigService.getRecommendedLanguages(),
        deviceLanguage: 'hi'
      };
    }
  }

  private detectDeviceLanguage(): string {
    // Get browser language
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    
    // Extract language code (e.g., 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Check if we support this language
    const supportedLang = LanguageConfigService.getLanguageByCode(langCode);
    return supportedLang ? langCode : 'hi';
  }

  async changeLanguage(languageCode: string): Promise<void> {
    await this.languageService.changeLanguage(languageCode);
    
    // Update preferences
    this.addToRecentLanguages(languageCode);
    this.preferences.preferredLanguage = languageCode;
    this.savePreferences();
  }

  private addToRecentLanguages(languageCode: string): void {
    // Remove if already exists
    this.preferences.recentLanguages = this.preferences.recentLanguages.filter(
      code => code !== languageCode
    );
    
    // Add to beginning
    this.preferences.recentLanguages.unshift(languageCode);
    
    // Keep only last 5
    this.preferences.recentLanguages = this.preferences.recentLanguages.slice(0, 5);
  }

  getRecentLanguages(): LanguageInfo[] {
    return this.preferences.recentLanguages
      .map(code => LanguageConfigService.getLanguageByCode(code))
      .filter(Boolean) as LanguageInfo[];
  }

  updatePreferences(updates: Partial<LanguagePreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  private loadPreferences(): LanguagePreferences {
    try {
      const stored = localStorage.getItem('language-preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load language preferences:', error);
    }

    return {
      recentLanguages: [],
      preferredLanguage: 'hi',
      autoDetect: true,
      locationBased: true
    };
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('language-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save language preferences:', error);
    }
  }
}
