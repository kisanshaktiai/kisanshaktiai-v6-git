import { LanguageService } from './LanguageService';
import { PerformanceCache } from './PerformanceCache';
import i18n from 'i18next';

interface TranslationChunk {
  id: string;
  feature: string;
  data: { [key: string]: any };
  priority: 'high' | 'medium' | 'low';
  size: number;
}

interface LanguageBundle {
  common: TranslationChunk;
  dashboard: TranslationChunk;
  chat: TranslationChunk;
  weather: TranslationChunk;
  crops: TranslationChunk;
  market: TranslationChunk;
  auth: TranslationChunk;
  profile: TranslationChunk;
}

interface TranslationMemory {
  source: string;
  target: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  confidence: number;
}

export class EnhancedTranslationService {
  private static instance: EnhancedTranslationService;
  private cache: PerformanceCache;
  private languageService: LanguageService;
  private loadedChunks: Map<string, Set<string>> = new Map(); // language -> chunk IDs
  private translationMemory: Map<string, TranslationMemory> = new Map();
  private preloadQueue: Set<string> = new Set();
  
  private constructor() {
    this.cache = PerformanceCache.getInstance();
    this.languageService = LanguageService.getInstance();
    this.initializeTranslationMemory();
  }

  static getInstance(): EnhancedTranslationService {
    if (!this.instance) {
      this.instance = new EnhancedTranslationService();
    }
    return this.instance;
  }

  /**
   * Load language dynamically with intelligent chunking
   */
  async loadLanguage(
    languageCode: string,
    features: string[] = ['common'],
    tenant?: string
  ): Promise<void> {
    try {
      console.log(`🌐 Loading language: ${languageCode} for features:`, features);
      
      // Check what's already loaded
      const loadedForLang = this.loadedChunks.get(languageCode) || new Set();
      const chunksToLoad = features.filter(feature => !loadedForLang.has(feature));
      
      if (chunksToLoad.length === 0) {
        console.log(`✅ Language chunks already loaded for ${languageCode}`);
        return;
      }

      // Load chunks in parallel
      const loadPromises = chunksToLoad.map(feature => 
        this.loadTranslationChunk(languageCode, feature, tenant)
      );

      const chunks = await Promise.all(loadPromises);
      
      // Merge chunks into i18n
      const mergedTranslations = this.mergeTranslationChunks(chunks);
      await this.addTranslationsToI18n(languageCode, mergedTranslations);
      
      // Update loaded chunks tracking
      chunksToLoad.forEach(feature => loadedForLang.add(feature));
      this.loadedChunks.set(languageCode, loadedForLang);
      
      console.log(`✅ Language loaded: ${languageCode}`, chunksToLoad);
    } catch (error) {
      console.error(`❌ Failed to load language ${languageCode}:`, error);
      throw error;
    }
  }

  /**
   * Preload translations based on user journey patterns
   */
  async preloadTranslationsForJourney(
    currentLanguage: string,
    expectedFeatures: string[],
    tenant?: string
  ): Promise<void> {
    const preloadKey = `${currentLanguage}-${expectedFeatures.join(',')}`;
    
    if (this.preloadQueue.has(preloadKey)) {
      return;
    }
    
    this.preloadQueue.add(preloadKey);
    
    try {
      // Preload in background
      setTimeout(async () => {
        await this.loadLanguage(currentLanguage, expectedFeatures, tenant);
        this.preloadQueue.delete(preloadKey);
      }, 100);
      
      console.log(`🚀 Preloading translations for journey:`, expectedFeatures);
    } catch (error) {
      console.warn('Translation preloading failed:', error);
      this.preloadQueue.delete(preloadKey);
    }
  }

  /**
   * Smart translation with memory and caching
   */
  async translateWithMemory(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    tenant?: string
  ): Promise<string> {
    try {
      // Check translation memory first
      const memoryKey = `${text}-${sourceLanguage}-${targetLanguage}`;
      const cachedTranslation = this.translationMemory.get(memoryKey);
      
      if (cachedTranslation && cachedTranslation.confidence > 0.8) {
        console.log('🧠 Translation from memory:', text);
        return cachedTranslation.target;
      }
      
      // Check cache
      const cacheKey = `translate-${sourceLanguage}-${targetLanguage}-${text.slice(0, 50)}`;
      const cached = await this.cache.get('translations', cacheKey, tenant);
      
      if (cached) {
        this.addToTranslationMemory(text, cached, sourceLanguage, targetLanguage, 1.0);
        return cached;
      }
      
      // Call translation API (would integrate with actual service)
      const translated = await this.callTranslationAPI(text, sourceLanguage, targetLanguage);
      
      // Cache result
      await this.cache.set('translations', cacheKey, translated, tenant);
      
      // Add to translation memory
      this.addToTranslationMemory(text, translated, sourceLanguage, targetLanguage, 0.9);
      
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Fallback to original text
    }
  }

  /**
   * Get translation bundle size for optimization
   */
  async getLanguageBundleSize(languageCode: string): Promise<{
    total: number;
    chunks: { [feature: string]: number };
  }> {
    try {
      const features = ['common', 'dashboard', 'chat', 'weather', 'crops', 'market', 'auth', 'profile'];
      const sizes: { [feature: string]: number } = {};
      let total = 0;
      
      for (const feature of features) {
        const chunk = await this.getTranslationChunk(languageCode, feature);
        const size = new Blob([JSON.stringify(chunk.data)]).size;
        sizes[feature] = size;
        total += size;
      }
      
      return { total, chunks: sizes };
    } catch (error) {
      console.error('Failed to calculate bundle size:', error);
      return { total: 0, chunks: {} };
    }
  }

  /**
   * Optimize translation bundle by removing unused keys
   */
  async optimizeTranslationBundle(
    languageCode: string,
    usedKeys: string[],
    tenant?: string
  ): Promise<void> {
    try {
      const features = ['common', 'dashboard', 'chat', 'weather', 'crops', 'market', 'auth', 'profile'];
      
      for (const feature of features) {
        const chunk = await this.getTranslationChunk(languageCode, feature);
        const optimizedData = this.filterTranslationsByUsage(chunk.data, usedKeys);
        
        // Save optimized chunk
        await this.cache.set(
          'translations-optimized',
          `${languageCode}-${feature}`,
          { ...chunk, data: optimizedData },
          tenant
        );
      }
      
      console.log(`🎯 Optimized translation bundle for ${languageCode}`);
    } catch (error) {
      console.error('Translation optimization failed:', error);
    }
  }

  /**
   * Clear translation cache for a specific language
   */
  async clearLanguageCache(languageCode: string, tenant?: string): Promise<void> {
    try {
      // Clear from loaded chunks tracking
      this.loadedChunks.delete(languageCode);
      
      // Clear from cache
      const features = ['common', 'dashboard', 'chat', 'weather', 'crops', 'market', 'auth', 'profile'];
      const clearPromises = features.map(feature =>
        this.cache.invalidate('translations', `${languageCode}-${feature}`, tenant)
      );
      
      await Promise.all(clearPromises);
      
      // Clear translation memory for this language
      const keysToDelete: string[] = [];
      this.translationMemory.forEach((value, key) => {
        if (key.includes(`-${languageCode}-`) || key.includes(`-${languageCode}`)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.translationMemory.delete(key));
      
      console.log(`🧹 Cleared translation cache for ${languageCode}`);
    } catch (error) {
      console.error('Failed to clear language cache:', error);
    }
  }

  // Private methods
  private async loadTranslationChunk(
    languageCode: string,
    feature: string,
    tenant?: string
  ): Promise<TranslationChunk> {
    try {
      // Try cache first
      const cacheKey = `${languageCode}-${feature}`;
      const cached = await this.cache.get('translations', cacheKey, tenant);
      
      if (cached) {
        return cached;
      }
      
      // Load from dynamic import
      const chunk = await this.dynamicImportTranslation(languageCode, feature);
      
      // Cache for next time
      await this.cache.set('translations', cacheKey, chunk, tenant);
      
      return chunk;
    } catch (error) {
      console.error(`Failed to load translation chunk ${feature} for ${languageCode}:`, error);
      throw error;
    }
  }

  private async dynamicImportTranslation(
    languageCode: string,
    feature: string
  ): Promise<TranslationChunk> {
    try {
      // Dynamic import based on feature and language
      let translations;
      
      if (feature === 'dashboard') {
        translations = await import(`@/locales/dashboard-${languageCode}.json`);
      } else {
        // For other features, use the main language file
        translations = await import(`@/locales/${languageCode}.json`);
      }
      
      // Filter translations for this feature
      const featureTranslations = this.filterTranslationsForFeature(translations.default, feature);
      
      return {
        id: `${languageCode}-${feature}`,
        feature,
        data: featureTranslations,
        priority: this.getFeaturePriority(feature),
        size: new Blob([JSON.stringify(featureTranslations)]).size
      };
    } catch (error) {
      console.error(`Dynamic import failed for ${languageCode}-${feature}:`, error);
      throw error;
    }
  }

  private filterTranslationsForFeature(
    translations: { [key: string]: any },
    feature: string
  ): { [key: string]: any } {
    // Define key patterns for each feature
    const featurePatterns: { [key: string]: RegExp[] } = {
      common: [/^(yes|no|cancel|submit|save|delete|edit|add|remove|search|loading)$/i],
      dashboard: [/^(dashboard|summary|overview|quick|recent|stats)$/i],
      chat: [/^(chat|message|ai|ask|voice|record|send)$/i],
      weather: [/^(weather|temperature|humidity|rain|wind|forecast)$/i],
      crops: [/^(crop|plant|seed|harvest|field|land|soil)$/i],
      market: [/^(market|price|sell|buy|trade|dealer|commission)$/i],
      auth: [/^(login|signup|verify|otp|phone|profile|register)$/i],
      profile: [/^(profile|name|email|location|language|settings)$/i]
    };
    
    const patterns = featurePatterns[feature] || [];
    const filtered: { [key: string]: any } = {};
    
    // Always include common keys
    if (feature !== 'common') {
      const commonKeys = ['yes', 'no', 'cancel', 'submit', 'save', 'loading'];
      commonKeys.forEach(key => {
        if (translations[key]) {
          filtered[key] = translations[key];
        }
      });
    }
    
    // Filter by patterns
    Object.keys(translations).forEach(key => {
      if (patterns.some(pattern => pattern.test(key))) {
        filtered[key] = translations[key];
      }
    });
    
    // If no patterns matched, include all (for backward compatibility)
    if (Object.keys(filtered).length === 0 && feature === 'common') {
      return translations;
    }
    
    return filtered;
  }

  private mergeTranslationChunks(chunks: TranslationChunk[]): { [key: string]: any } {
    const merged: { [key: string]: any } = {};
    
    chunks.forEach(chunk => {
      Object.assign(merged, chunk.data);
    });
    
    return merged;
  }

  private async addTranslationsToI18n(
    languageCode: string,
    translations: { [key: string]: any }
  ): Promise<void> {
    // Add to i18n resources
    i18n.addResourceBundle(languageCode, 'translation', translations, true, true);
  }

  private getFeaturePriority(feature: string): 'high' | 'medium' | 'low' {
    const priorities: { [key: string]: 'high' | 'medium' | 'low' } = {
      common: 'high',
      auth: 'high',
      dashboard: 'high',
      chat: 'medium',
      weather: 'medium',
      crops: 'medium',
      market: 'low',
      profile: 'low'
    };
    
    return priorities[feature] || 'low';
  }

  private async getTranslationChunk(
    languageCode: string,
    feature: string
  ): Promise<TranslationChunk> {
    const cacheKey = `${languageCode}-${feature}`;
    const cached = await this.cache.get('translations', cacheKey);
    
    if (cached) {
      return cached;
    }
    
    return await this.dynamicImportTranslation(languageCode, feature);
  }

  private filterTranslationsByUsage(
    translations: { [key: string]: any },
    usedKeys: string[]
  ): { [key: string]: any } {
    const filtered: { [key: string]: any } = {};
    
    usedKeys.forEach(key => {
      if (translations[key]) {
        filtered[key] = translations[key];
      }
    });
    
    return filtered;
  }

  private initializeTranslationMemory(): void {
    try {
      const stored = localStorage.getItem('translation-memory');
      if (stored) {
        const memoryArray = JSON.parse(stored) as TranslationMemory[];
        memoryArray.forEach(item => {
          const key = `${item.source}-${item.sourceLanguage}-${item.targetLanguage}`;
          this.translationMemory.set(key, item);
        });
      }
    } catch (error) {
      console.warn('Failed to load translation memory:', error);
    }
  }

  private addToTranslationMemory(
    source: string,
    target: string,
    sourceLanguage: string,
    targetLanguage: string,
    confidence: number
  ): void {
    const key = `${source}-${sourceLanguage}-${targetLanguage}`;
    const item: TranslationMemory = {
      source,
      target,
      sourceLanguage,
      targetLanguage,
      timestamp: Date.now(),
      confidence
    };
    
    this.translationMemory.set(key, item);
    
    // Persist to localStorage (keep only recent items)
    try {
      const memoryArray = Array.from(this.translationMemory.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 1000); // Keep only 1000 most recent
      
      localStorage.setItem('translation-memory', JSON.stringify(memoryArray));
    } catch (error) {
      console.warn('Failed to persist translation memory:', error);
    }
  }

  private async callTranslationAPI(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // This would integrate with the actual translation service
    // For now, return the original text
    console.log(`🔄 Translating \"${text}\" from ${sourceLanguage} to ${targetLanguage}`);
    return text;
  }
}
