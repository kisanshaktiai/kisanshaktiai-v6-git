
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {SUPPORTED_LANGUAGES.map((language) => (
        <Button
          key={language.code}
          variant={selectedLanguage === language.code ? 'default' : 'outline'}
          className={`relative h-16 p-3 flex flex-col items-center justify-center text-center ${
            selectedLanguage === language.code 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'hover:bg-green-50'
          }`}
          onClick={() => onLanguageChange(language.code)}
        >
          {selectedLanguage === language.code && (
            <Check className="absolute top-1 right-1 w-4 h-4" />
          )}
          <span className="text-lg mb-1">{language.flag}</span>
          <span className="text-sm font-medium">{language.nativeName}</span>
        </Button>
      ))}
    </div>
  );
};
