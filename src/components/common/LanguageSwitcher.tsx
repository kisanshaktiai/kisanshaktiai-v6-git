
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Check, Loader2, Star, Clock } from 'lucide-react';
import { LanguageConfigService } from '@/config/languages';

interface LanguageSwitcherProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showRecommended?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  showText = false, 
  size = 'md',
  showRecommended = true
}) => {
  const { t } = useTranslation();
  const { 
    currentLanguage, 
    changeLanguage, 
    isChangingLanguage, 
    supportedLanguages,
    getRecommendedLanguages
  } = useLanguage();

  const [recommendedLanguages, setRecommendedLanguages] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (showRecommended) {
      getRecommendedLanguages().then(setRecommendedLanguages);
    }
  }, [showRecommended]);

  const currentLangData = LanguageConfigService.getLanguageByCode(currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
  };

  const buttonSizes = {
    sm: 'h-8 px-2',
    md: 'h-10 px-3',
    lg: 'h-12 px-4'
  };

  const isRecommended = (langCode: string) => 
    recommendedLanguages.some(lang => lang.code === langCode);

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
            <>
              <span className="text-base">{currentLangData?.flag || '🌐'}</span>
              <Languages className="h-4 w-4" />
            </>
          )}
          {showText && (
            <span className="text-sm font-medium">
              {currentLangData?.nativeName || currentLanguage.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
        {/* Recommended Languages */}
        {showRecommended && recommendedLanguages.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center">
              <Star className="w-3 h-3 mr-1" />
              {t('language.recommended', 'Recommended')}
            </div>
            {recommendedLanguages.slice(0, 3).map((language) => (
              <DropdownMenuItem
                key={`rec-${language.code}`}
                onClick={() => handleLanguageChange(language.code)}
                className="flex items-center justify-between cursor-pointer px-2 py-2"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{language.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{language.name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {currentLanguage === language.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* All Languages */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center">
          <Languages className="w-3 h-3 mr-1" />
          {t('language.allLanguages', 'All Languages')}
        </div>
        {supportedLanguages.map((language) => {
          // Skip if already shown in recommended section
          if (showRecommended && recommendedLanguages.some(rec => rec.code === language.code)) {
            return null;
          }

          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer px-2 py-2"
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{language.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{language.name}</span>
                </div>
              </div>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}

        {/* Loading State */}
        {isChangingLanguage && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
              {t('language.changing', 'Changing language...')}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
