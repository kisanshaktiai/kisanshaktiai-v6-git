
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageService } from '@/services';
import { EnhancedLanguageService } from '@/services/EnhancedLanguageService';
import { LanguageConfigService, LanguageInfo } from '@/config/languages';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setLanguage } from '@/store/slices/farmerSlice';
import { loadLanguageResources } from '@/i18n';
import { useAuth } from '@/hooks';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isChangingLanguage: boolean;
  supportedLanguages: LanguageInfo[];
  updateProfileLanguage: (languageCode: string) => Promise<void>;
  getRecommendedLanguages: () => Promise<LanguageInfo[]>;
  searchLanguages: (query: string) => LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { updateProfile, profile } = useAuth();
  const { selectedLanguage } = useSelector((state: RootState) => state.farmer);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  
  const languageService = LanguageService.getInstance();
  const enhancedLanguageService = EnhancedLanguageService.getInstance();
  const supportedLanguages = LanguageConfigService.getAllLanguagesSorted();

  const updateProfileLanguage = async (languageCode: string) => {
    try {
      if (updateProfile && profile) {
        await updateProfile({ preferred_language: languageCode as any });
        console.log(`Updated profile language to: ${languageCode}`);
      }
    } catch (error) {
      console.error('Failed to update profile language:', error);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    if (languageCode === i18n.language) return;

    try {
      setIsChangingLanguage(true);
      
      // Lazy load language resources if not already loaded
      const loaded = await loadLanguageResources(languageCode);
      if (!loaded && !['en', 'hi'].includes(languageCode)) {
        console.warn(`Failed to load language ${languageCode}, falling back to English`);
        languageCode = 'en';
      }
      
      // Change language using enhanced service
      await enhancedLanguageService.changeLanguage(languageCode);
      
      // Update Redux state
      dispatch(setLanguage(languageCode));
      
      // Update user profile language preference
      await updateProfileLanguage(languageCode);
      
      // Force re-render of all components
      document.documentElement.lang = languageCode;
      
      console.log(`Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const getRecommendedLanguages = async (): Promise<LanguageInfo[]> => {
    try {
      const detection = await enhancedLanguageService.detectBestLanguage();
      return detection.recommended;
    } catch (error) {
      console.error('Failed to get language recommendations:', error);
      return LanguageConfigService.getRecommendedLanguages();
    }
  };

  const searchLanguages = (query: string): LanguageInfo[] => {
    return LanguageConfigService.searchLanguages(query);
  };

  // Initialize language on mount and when profile changes
  useEffect(() => {
    const initializeLanguage = async () => {
      // Priority order: profile preferred_language > Redux selectedLanguage > localStorage > detected language
      const profileLanguage = profile?.preferred_language;
      const reduxLanguage = selectedLanguage;
      const localLanguage = localStorage.getItem('selectedLanguage') || localStorage.getItem('i18nextLng');
      
      let languageToUse = profileLanguage || reduxLanguage || localLanguage;
      
      // If no language is set, detect the best one
      if (!languageToUse) {
        try {
          const detection = await enhancedLanguageService.detectBestLanguage();
          languageToUse = detection.recommended[0]?.code || 'hi';
        } catch (error) {
          languageToUse = 'hi'; // Fallback to Hindi
        }
      }
      
      console.log('Language initialization:', {
        profileLanguage,
        reduxLanguage, 
        localLanguage,
        chosen: languageToUse,
        current: i18n.language
      });
      
      if (languageToUse && languageToUse !== i18n.language) {
        await changeLanguage(languageToUse);
      }
    };

    // Only initialize when we have profile data or on initial mount
    if (profile !== undefined) {
      initializeLanguage();
    }
  }, [profile?.preferred_language]);

  // Listen for language changes from other sources
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (lng !== selectedLanguage) {
        dispatch(setLanguage(lng));
        document.documentElement.lang = lng;
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [selectedLanguage, dispatch]);

  const contextValue: LanguageContextType = {
    currentLanguage: i18n.language,
    changeLanguage,
    isChangingLanguage,
    supportedLanguages,
    updateProfileLanguage,
    getRecommendedLanguages,
    searchLanguages,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
