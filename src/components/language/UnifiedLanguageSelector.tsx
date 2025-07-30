
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Globe, 
  Search, 
  Check, 
  Loader2, 
  Star,
  Clock,
  Smartphone
} from 'lucide-react';
import { LanguageConfigService, LanguageInfo } from '@/config/languages';
import { EnhancedLanguageService } from '@/services/EnhancedLanguageService';
import { toast } from '@/hooks/use-toast';

interface UnifiedLanguageSelectorProps {
  onLanguageSelect: (languageCode: string) => Promise<void>;
  showLocationInfo?: boolean;
  showRecentLanguages?: boolean;
  showSearch?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export const UnifiedLanguageSelector: React.FC<UnifiedLanguageSelectorProps> = ({
  onLanguageSelect,
  showLocationInfo = true,
  showRecentLanguages = true,
  showSearch = true,
  variant = 'full',
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);
  const [recommendedLanguages, setRecommendedLanguages] = useState<LanguageInfo[]>([]);
  const [recentLanguages, setRecentLanguages] = useState<LanguageInfo[]>([]);
  const [allLanguages, setAllLanguages] = useState<LanguageInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState<LanguageInfo[]>([]);
  const [locationInfo, setLocationInfo] = useState<{
    deviceLanguage?: string;
    locationState?: string;
  }>({});
  const [isChanging, setIsChanging] = useState(false);

  const enhancedService = EnhancedLanguageService.getInstance();

  useEffect(() => {
    loadLanguageData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = LanguageConfigService.searchLanguages(searchQuery);
      setFilteredLanguages(filtered);
    } else {
      setFilteredLanguages([]);
    }
  }, [searchQuery]);

  const loadLanguageData = async () => {
    setIsLoading(true);
    try {
      // Get recommendations and location info
      const detection = await enhancedService.detectBestLanguage();
      setRecommendedLanguages(detection.recommended);
      setLocationInfo({
        deviceLanguage: detection.deviceLanguage,
        locationState: detection.locationState
      });

      // Get recent languages
      if (showRecentLanguages) {
        const recent = enhancedService.getRecentLanguages();
        setRecentLanguages(recent);
      }

      // Get all languages
      setAllLanguages(LanguageConfigService.getAllLanguagesSorted());

    } catch (error) {
      console.error('Failed to load language data:', error);
      toast({
        title: t('common.error'),
        description: t('language.loadError', 'Failed to load language options'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === selectedLanguage || isChanging) return;

    setIsChanging(true);
    try {
      await onLanguageSelect(languageCode);
      setSelectedLanguage(languageCode);
      
      toast({
        title: t('language.changed', 'Language Changed'),
        description: t('language.changedTo', `Language changed to {{language}}`, {
          language: LanguageConfigService.getLanguageByCode(languageCode)?.nativeName
        }),
      });
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: t('common.error'),
        description: t('language.changeError', 'Failed to change language'),
        variant: 'destructive',
      });
    } finally {
      setIsChanging(false);
    }
  };

  const LanguageCard: React.FC<{ 
    language: LanguageInfo; 
    isSelected: boolean; 
    isRecommended?: boolean;
    isRecent?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }> = ({ language, isSelected, isRecommended, isRecent, size = 'md' }) => {
    const cardSizes = {
      sm: 'p-2 min-h-[60px]',
      md: 'p-3 min-h-[80px]',
      lg: 'p-4 min-h-[100px]'
    };

    return (
      <Button
        variant={isSelected ? 'default' : 'outline'}
        className={`${cardSizes[size]} flex flex-col items-start text-left relative group hover:scale-105 transition-all duration-200 w-full`}
        onClick={() => handleLanguageSelect(language.code)}
        disabled={isChanging}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{language.flag}</span>
            {isRecommended && <Star className="w-3 h-3 text-yellow-500" />}
            {isRecent && <Clock className="w-3 h-3 text-blue-500" />}
          </div>
          {isSelected && <Check className="w-4 h-4 text-green-500" />}
        </div>
        
        <div className="flex flex-col items-start w-full">
          <span className="font-semibold text-sm truncate w-full">
            {language.nativeName}
          </span>
          <span className="text-xs text-muted-foreground truncate w-full">
            {language.name}
          </span>
          {size === 'lg' && (
            <span className="text-xs text-muted-foreground italic mt-1">
              {language.script}
            </span>
          )}
        </div>

        {language.isRTL && (
          <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
            RTL
          </Badge>
        )}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>{t('common.loading')}</span>
        </CardContent>
      </Card>
    );
  }

  const displayLanguages = searchQuery ? filteredLanguages : allLanguages;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Globe className="w-5 h-5" />
          <span>{t('language.selectLanguage', 'Select Language')}</span>
        </CardTitle>

        {/* Location & Device Info */}
        {showLocationInfo && (locationInfo.locationState || locationInfo.deviceLanguage) && (
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {locationInfo.locationState && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{locationInfo.locationState}</span>
              </div>
            )}
            {locationInfo.deviceLanguage && (
              <div className="flex items-center space-x-1">
                <Smartphone className="w-3 h-3" />
                <span>{LanguageConfigService.getLanguageByCode(locationInfo.deviceLanguage)?.name}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('language.searchPlaceholder', 'Search languages...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Recent Languages */}
        {showRecentLanguages && recentLanguages.length > 0 && !searchQuery && (
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{t('language.recent', 'Recently Used')}</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {recentLanguages.map((language) => (
                <LanguageCard
                  key={`recent-${language.code}`}
                  language={language}
                  isSelected={selectedLanguage === language.code}
                  isRecent
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Languages */}
        {recommendedLanguages.length > 0 && !searchQuery && (
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>{t('language.recommended', 'Recommended for You')}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {recommendedLanguages.map((language) => (
                <LanguageCard
                  key={`recommended-${language.code}`}
                  language={language}
                  isSelected={selectedLanguage === language.code}
                  isRecommended
                  size={variant === 'full' ? 'md' : 'sm'}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Languages */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>
              {searchQuery 
                ? t('language.searchResults', 'Search Results')
                : t('language.allLanguages', 'All Languages')
              }
            </span>
          </h4>
          
          <div className={`grid gap-2 max-h-64 overflow-y-auto ${
            variant === 'compact' ? 'grid-cols-3' : 'grid-cols-2'
          }`}>
            {displayLanguages.map((language) => (
              <LanguageCard
                key={`all-${language.code}`}
                language={language}
                isSelected={selectedLanguage === language.code}
                size={variant === 'minimal' ? 'sm' : 'md'}
              />
            ))}
          </div>

          {searchQuery && filteredLanguages.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              {t('language.noResults', 'No languages found')}
            </div>
          )}
        </div>

        {/* Loading State for Language Change */}
        {isChanging && (
          <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">
              {t('language.changing', 'Changing language...')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
