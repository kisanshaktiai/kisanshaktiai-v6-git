
export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  region: string;
  popularity: number;
  isRTL?: boolean;
  flag?: string;
}

export interface RegionalMapping {
  state: string;
  primaryLanguages: string[];
  secondaryLanguages: string[];
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    script: 'नमस्ते',
    region: 'North India',
    popularity: 9,
    flag: '🇮🇳'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Hello',
    region: 'Global',
    popularity: 10,
    flag: '🌐'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'नमस्कार',
    region: 'Maharashtra',
    popularity: 8,
    flag: '🇮🇳'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    region: 'Punjab',
    popularity: 7,
    flag: '🇮🇳'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'నమస్కారం',
    region: 'Andhra Pradesh, Telangana',
    popularity: 8,
    flag: '🇮🇳'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'வணக்கம்',
    region: 'Tamil Nadu',
    popularity: 8,
    flag: '🇮🇳'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'નમસ્તે',
    region: 'Gujarat',
    popularity: 7,
    flag: '🇮🇳'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'ನಮಸ್ಕಾರ',
    region: 'Karnataka',
    popularity: 7,
    flag: '🇮🇳'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'নমস্কার',
    region: 'West Bengal',
    popularity: 8,
    flag: '🇮🇳'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'നമസ്കാരം',
    region: 'Kerala',
    popularity: 7,
    flag: '🇮🇳'
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'ନମସ୍କାର',
    region: 'Odisha',
    popularity: 6,
    flag: '🇮🇳'
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'السلام علیکم',
    region: 'Uttar Pradesh, Bihar',
    popularity: 6,
    isRTL: true,
    flag: '🇮🇳'
  }
];

export const STATE_LANGUAGE_MAPPING: RegionalMapping[] = [
  {
    state: 'Andhra Pradesh',
    primaryLanguages: ['te', 'en'],
    secondaryLanguages: ['hi', 'ur']
  },
  {
    state: 'Telangana',
    primaryLanguages: ['te', 'hi'],
    secondaryLanguages: ['en', 'ur']
  },
  {
    state: 'Tamil Nadu',
    primaryLanguages: ['ta', 'en'],
    secondaryLanguages: ['te', 'hi']
  },
  {
    state: 'Karnataka',
    primaryLanguages: ['kn', 'en'],
    secondaryLanguages: ['hi', 'te', 'ta']
  },
  {
    state: 'Kerala',
    primaryLanguages: ['ml', 'en'],
    secondaryLanguages: ['hi', 'ta']
  },
  {
    state: 'Maharashtra',
    primaryLanguages: ['mr', 'hi'],
    secondaryLanguages: ['en', 'gu']
  },
  {
    state: 'Gujarat',
    primaryLanguages: ['gu', 'hi'],
    secondaryLanguages: ['en', 'mr']
  },
  {
    state: 'Punjab',
    primaryLanguages: ['pa', 'hi'],
    secondaryLanguages: ['en', 'ur']
  },
  {
    state: 'Haryana',
    primaryLanguages: ['hi', 'pa'],
    secondaryLanguages: ['en', 'ur']
  },
  {
    state: 'West Bengal',
    primaryLanguages: ['bn', 'hi'],
    secondaryLanguages: ['en', 'or']
  },
  {
    state: 'Odisha',
    primaryLanguages: ['or', 'hi'],
    secondaryLanguages: ['en', 'bn']
  },
  {
    state: 'Uttar Pradesh',
    primaryLanguages: ['hi', 'ur'],
    secondaryLanguages: ['en', 'pa']
  },
  {
    state: 'Madhya Pradesh',
    primaryLanguages: ['hi', 'en'],
    secondaryLanguages: ['mr', 'gu']
  },
  {
    state: 'Rajasthan',
    primaryLanguages: ['hi', 'en'],
    secondaryLanguages: ['gu', 'pa']
  },
  {
    state: 'Bihar',
    primaryLanguages: ['hi', 'ur'],
    secondaryLanguages: ['en', 'bn']
  },
  {
    state: 'Jharkhand',
    primaryLanguages: ['hi', 'en'],
    secondaryLanguages: ['bn', 'or']
  },
  {
    state: 'Chhattisgarh',
    primaryLanguages: ['hi', 'en'],
    secondaryLanguages: ['mr', 'or']
  },
  {
    state: 'Delhi',
    primaryLanguages: ['hi', 'en'],
    secondaryLanguages: ['pa', 'ur']
  }
];

export class LanguageConfigService {
  static getLanguageByCode(code: string): LanguageInfo | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  }

  static getRecommendedLanguages(state?: string, deviceLanguage?: string): LanguageInfo[] {
    const recommendations: LanguageInfo[] = [];
    
    // Get languages based on state
    if (state) {
      const mapping = STATE_LANGUAGE_MAPPING.find(m => m.state === state);
      if (mapping) {
        // Add primary languages first
        mapping.primaryLanguages.forEach(code => {
          const lang = this.getLanguageByCode(code);
          if (lang) recommendations.push(lang);
        });
        
        // Add secondary languages
        mapping.secondaryLanguages.forEach(code => {
          const lang = this.getLanguageByCode(code);
          if (lang && !recommendations.find(r => r.code === code)) {
            recommendations.push(lang);
          }
        });
      }
    }
    
    // Add device language if not already included
    if (deviceLanguage) {
      const deviceLang = this.getLanguageByCode(deviceLanguage);
      if (deviceLang && !recommendations.find(r => r.code === deviceLanguage)) {
        recommendations.unshift(deviceLang);
      }
    }
    
    // If no recommendations, use popular defaults
    if (recommendations.length === 0) {
      recommendations.push(
        this.getLanguageByCode('hi')!,
        this.getLanguageByCode('en')!
      );
    }
    
    return recommendations.slice(0, 4); // Limit to 4 recommendations
  }

  static getAllLanguagesSorted(): LanguageInfo[] {
    return [...SUPPORTED_LANGUAGES].sort((a, b) => b.popularity - a.popularity);
  }

  static searchLanguages(query: string): LanguageInfo[] {
    const lowerQuery = query.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(lang =>
      lang.name.toLowerCase().includes(lowerQuery) ||
      lang.nativeName.includes(query) ||
      lang.region.toLowerCase().includes(lowerQuery)
    );
  }
}
