
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageConfigService, LanguageInfo } from '@/config/languages';
import { useDispatch } from 'react-redux';
import { setLanguage } from '@/store/slices/farmerSlice';
import { languageSyncService } from '@/services/LanguageSyncService';
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
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
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
    if (languageCode === i18n.language || isChangingLanguage) return;

    try {
      setIsChangingLanguage(true);
      
      // Use language sync service for consistent state management
      await languageSyncService.changeLanguage(languageCode, updateProfile);
      
      // Update Redux state
      dispatch(setLanguage(languageCode));
      
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
      const enhancedService = await import('@/services/EnhancedLanguageService');
      const detection = await enhancedService.EnhancedLanguageService.getInstance().detectBestLanguage();
      return detection.recommended;
    } catch (error) {
      console.error('Failed to get language recommendations:', error);
      return LanguageConfigService.getRecommendedLanguages();
    }
  };

  const searchLanguages = (query: string): LanguageInfo[] => {
    return LanguageConfigService.searchLanguages(query);
  };

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const initialLanguage = await languageSyncService.initializeLanguage();
        dispatch(setLanguage(initialLanguage));
        document.documentElement.lang = initialLanguage;
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize language:', error);
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeLanguage();
    }
  }, [dispatch, isInitialized]);

  // Apply profile language when authenticated
  useEffect(() => {
    const applyProfileLanguage = async () => {
      if (profile?.preferred_language && isInitialized) {
        try {
          await languageSyncService.applyProfileLanguage(
            profile.preferred_language,
            updateProfile
          );
          dispatch(setLanguage(profile.preferred_language));
          document.documentElement.lang = profile.preferred_language;
        } catch (error) {
          console.error('Failed to apply profile language:', error);
        }
      }
    };

    applyProfileLanguage();
  }, [profile?.preferred_language, isInitialized, updateProfile, dispatch]);

  // Listen for language changes from i18next
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      dispatch(setLanguage(lng));
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [dispatch]);

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
