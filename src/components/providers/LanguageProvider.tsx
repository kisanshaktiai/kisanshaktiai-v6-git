
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageService } from '@/services/LanguageService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setLanguage } from '@/store/slices/farmerSlice';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isChangingLanguage: boolean;
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
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
  const { language } = useSelector((state: RootState) => state.farmer);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  
  const languageService = LanguageService.getInstance();
  const supportedLanguages = languageService.getSupportedLanguages();

  const changeLanguage = async (languageCode: string) => {
    if (languageCode === i18n.language) return;

    try {
      setIsChangingLanguage(true);
      
      // Change language in i18n
      await i18n.changeLanguage(languageCode);
      
      // Update Redux state
      dispatch(setLanguage(languageCode));
      
      // Update LanguageService
      await languageService.changeLanguage(languageCode);
      
      // Force re-render of all components
      document.documentElement.lang = languageCode;
      
      console.log(`Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      const storedLanguage = language || localStorage.getItem('i18nextLng') || 'en';
      
      if (storedLanguage !== i18n.language) {
        await changeLanguage(storedLanguage);
      }
    };

    initializeLanguage();
  }, []);

  // Listen for language changes from other sources
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (lng !== language) {
        dispatch(setLanguage(lng));
        document.documentElement.lang = lng;
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [language, dispatch]);

  const contextValue: LanguageContextType = {
    currentLanguage: i18n.language,
    changeLanguage,
    isChangingLanguage,
    supportedLanguages,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
