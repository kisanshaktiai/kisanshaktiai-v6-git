
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageService } from '@/services/LanguageService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setLanguage } from '@/store/slices/farmerSlice';
import { loadLanguageResources } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isChangingLanguage: boolean;
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
  updateProfileLanguage: (languageCode: string) => Promise<void>;
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
  const supportedLanguages = languageService.getSupportedLanguages();

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
      
      // Change language in i18n
      await i18n.changeLanguage(languageCode);
      
      // Update Redux state
      dispatch(setLanguage(languageCode));
      
      // Update LanguageService
      await languageService.changeLanguage(languageCode);
      
      // Update user profile language preference
      await updateProfileLanguage(languageCode);
      
      // Store in localStorage as backup
      localStorage.setItem('selectedLanguage', languageCode);
      
      // Force re-render of all components
      document.documentElement.lang = languageCode;
      
      console.log(`Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  // Initialize language on mount and when profile changes
  useEffect(() => {
    const initializeLanguage = async () => {
      // Priority order: profile preferred_language > Redux selectedLanguage > localStorage > default
      const profileLanguage = profile?.preferred_language;
      const reduxLanguage = selectedLanguage;
      const localLanguage = localStorage.getItem('selectedLanguage') || localStorage.getItem('i18nextLng');
      const defaultLanguage = 'hi'; // Default for Indian farmers
      
      const languageToUse = profileLanguage || reduxLanguage || localLanguage || defaultLanguage;
      
      console.log('Language initialization:', {
        profileLanguage,
        reduxLanguage, 
        localLanguage,
        defaultLanguage,
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
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
