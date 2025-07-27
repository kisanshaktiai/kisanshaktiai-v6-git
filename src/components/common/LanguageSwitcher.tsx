
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Check, Loader2 } from 'lucide-react';

interface LanguageSwitcherProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  showText = false, 
  size = 'md' 
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isChangingLanguage, supportedLanguages } = useLanguage();

  const currentLangData = supportedLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
  };

  const buttonSizes = {
    sm: 'h-8 px-2',
    md: 'h-10 px-3',
    lg: 'h-12 px-4'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`${buttonSizes[size]} flex items-center space-x-2`}
          disabled={isChangingLanguage}
        >
          {isChangingLanguage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          {showText && (
            <span className="text-sm font-medium">
              {currentLangData?.nativeName || currentLanguage.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
