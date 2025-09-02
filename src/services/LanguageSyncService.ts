
import { LanguageService } from './LanguageService';
import { EnhancedLanguageService } from './EnhancedLanguageService';
import { LanguageConfigService } from '@/config/languages';
import { secureStorage } from './storage/secureStorage';

export interface LanguageState {
  currentLanguage: string;
  source: 'localStorage' | 'database' | 'detection' | 'default';
  isAuthenticated: boolean;
}

export class LanguageSyncService {
  private static instance: LanguageSyncService;
  private languageService: LanguageService;
  private enhancedService: EnhancedLanguageService;
  private currentState: LanguageState | null = null;

  static getInstance(): LanguageSyncService {
    if (!LanguageSyncService.instance) {
      LanguageSyncService.instance = new LanguageSyncService();
    }
    return LanguageSyncService.instance;
  }

  constructor() {
    this.languageService = LanguageService.getInstance();
    this.enhancedService = EnhancedLanguageService.getInstance();
  }

  /**
   * Get the current language from the highest priority source
   */
  async getCurrentLanguage(): Promise<LanguageState> {
    if (this.currentState) {
      return this.currentState;
    }

    // Check localStorage first
    const storedLanguage = await secureStorage.get('selectedLanguage');
    if (storedLanguage && this.isValidLanguage(storedLanguage)) {
      this.currentState = {
        currentLanguage: storedLanguage,
        source: 'localStorage',
        isAuthenticated: false
      };
      return this.currentState;
    }

    // Fallback to detection
    try {
      const detection = await this.enhancedService.detectBestLanguage();
      const detectedLanguage = detection.recommended[0]?.code || 'hi';
      
      this.currentState = {
        currentLanguage: detectedLanguage,
        source: 'detection',
        isAuthenticated: false
      };
      return this.currentState;
    } catch (error) {
      console.error('Language detection failed:', error);
    }

    // Final fallback
    this.currentState = {
      currentLanguage: 'hi',
      source: 'default',
      isAuthenticated: false
    };
    return this.currentState;
  }

  /**
   * Apply language from database profile (for authenticated users)
   */
  async applyProfileLanguage(profileLanguage: string, updateProfile?: (updates: any) => Promise<any>): Promise<void> {
    if (!profileLanguage || !this.isValidLanguage(profileLanguage)) {
      return;
    }

    console.log('Applying profile language:', profileLanguage);

    // Update all language states
    await this.syncAllLanguageStates(profileLanguage, 'database');

    this.currentState = {
      currentLanguage: profileLanguage,
      source: 'database',
      isAuthenticated: true
    };
  }

  /**
   * Change language and sync to all sources
   */
  async changeLanguage(
    languageCode: string, 
    updateProfile?: (updates: any) => Promise<any>
  ): Promise<void> {
    if (!this.isValidLanguage(languageCode)) {
      throw new Error(`Invalid language code: ${languageCode}`);
    }

    console.log('Changing language to:', languageCode);

    // Update all language states
    await this.syncAllLanguageStates(languageCode, 'localStorage');

    // Update database profile if authenticated
    if (updateProfile) {
      try {
        await updateProfile({ preferred_language: languageCode });
        console.log('Updated database profile language');
      } catch (error) {
        console.error('Failed to update profile language:', error);
      }
    }

    this.currentState = {
      currentLanguage: languageCode,
      source: 'localStorage',
      isAuthenticated: !!updateProfile
    };
  }

  /**
   * Initialize language on app startup
   */
  async initializeLanguage(): Promise<string> {
    const state = await this.getCurrentLanguage();
    
    // Apply the language without triggering profile updates
    await this.languageService.changeLanguage(state.currentLanguage);
    
    // Store in localStorage if not from localStorage
    if (state.source !== 'localStorage') {
      await secureStorage.set('selectedLanguage', state.currentLanguage);
    }

    console.log('Language initialized:', {
      language: state.currentLanguage,
      source: state.source
    });

    return state.currentLanguage;
  }

  /**
   * Check if language selection is needed
   */
  async needsLanguageSelection(): Promise<boolean> {
    const storedLanguage = await secureStorage.get('selectedLanguage');
    return !storedLanguage || !this.isValidLanguage(storedLanguage);
  }

  /**
   * Store language selection from onboarding
   */
  async storeLanguageSelection(languageCode: string): Promise<void> {
    if (!this.isValidLanguage(languageCode)) {
      throw new Error(`Invalid language code: ${languageCode}`);
    }

    await secureStorage.set('selectedLanguage', languageCode);
    await this.languageService.changeLanguage(languageCode);

    this.currentState = {
      currentLanguage: languageCode,
      source: 'localStorage',
      isAuthenticated: false
    };

    console.log('Language selection stored:', languageCode);
  }

  /**
   * Get language for new user registration
   */
  async getLanguageForRegistration(): Promise<string> {
    const storedLanguage = await secureStorage.get('selectedLanguage');
    if (storedLanguage && this.isValidLanguage(storedLanguage)) {
      return storedLanguage;
    }

    // Fallback to current i18n language
    return this.languageService.getCurrentLanguage() || 'hi';
  }

  /**
   * Sync all language states
   */
  private async syncAllLanguageStates(languageCode: string, source: LanguageState['source']): Promise<void> {
    // Update localStorage
    await secureStorage.set('selectedLanguage', languageCode);
    
    // Update i18next
    await this.languageService.changeLanguage(languageCode);
    
    // Update enhanced service preferences
    this.enhancedService.updatePreferences({
      preferredLanguage: languageCode
    });

    console.log(`Synced all language states to: ${languageCode} (source: ${source})`);
  }

  private isValidLanguage(languageCode: string): boolean {
    return !!LanguageConfigService.getLanguageByCode(languageCode);
  }

  /**
   * Reset language state (for logout)
   */
  reset(): void {
    this.currentState = null;
  }
}

export const languageSyncService = LanguageSyncService.getInstance();
