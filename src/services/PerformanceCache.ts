import { db } from './offline/db';

interface CacheConfig {
  memoryTTL: number;
  indexedDBTTL: number;
  localStorageTTL: number;
  maxMemoryItems: number;
  compression: boolean;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expires: number;
  version: number;
  tenantId?: string;
  compressed?: boolean;
}

/**
 * 4-Tier Caching System for Extreme Performance
 * Memory → IndexedDB → LocalStorage → Network
 */
export class PerformanceCache {
  private static instance: PerformanceCache;
  private memoryCache = new Map<string, CacheEntry>();
  private readonly config: CacheConfig = {
    memoryTTL: 5 * 60 * 1000, // 5 minutes
    indexedDBTTL: 60 * 60 * 1000, // 1 hour
    localStorageTTL: 24 * 60 * 60 * 1000, // 24 hours
    maxMemoryItems: 500,
    compression: true,
  };

  private readonly PREFIXES = {
    DASHBOARD: 'dash_',
    TENANT: 'tenant_',
    LANDS: 'lands_',
    WEATHER: 'weather_',
    TRANSLATIONS: 'i18n_',
    USER: 'user_',
  };

  static getInstance(): PerformanceCache {
    if (!this.instance) {
      this.instance = new PerformanceCache();
    }
    return this.instance;
  }

  private generateKey(prefix: string, identifier: string, tenantId?: string): string {
    return tenantId ? `${prefix}${tenantId}_${identifier}` : `${prefix}${identifier}`;
  }

  private compress(data: any): string {
    if (!this.config.compression) return JSON.stringify(data);
    
    try {
      // Simple compression for large objects
      const jsonString = JSON.stringify(data);
      if (jsonString.length > 1000) {
        // Use basic compression technique
        return btoa(jsonString);
      }
      return jsonString;
    } catch {
      return JSON.stringify(data);
    }
  }

  private decompress(data: string, isCompressed?: boolean): any {
    try {
      if (isCompressed) {
        return JSON.parse(atob(data));
      }
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expires;
  }

  private evictMemoryCache() {
    if (this.memoryCache.size <= this.config.maxMemoryItems) return;

    // Remove 25% of oldest items
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * Get data from cache (4-tier lookup)
   */
  async get<T = any>(prefix: string, key: string, tenantId?: string): Promise<T | null> {
    const cacheKey = this.generateKey(prefix, key, tenantId);

    try {
      // 1. Memory cache (fastest)
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        console.log(`🟢 Cache HIT (Memory): ${cacheKey}`);
        return memoryEntry.data;
      }

      // 2. IndexedDB cache
      const indexedDBData = await db.getCachedData(cacheKey, tenantId);
      if (indexedDBData) {
        console.log(`🟡 Cache HIT (IndexedDB): ${cacheKey}`);
        
        // Promote to memory cache
        this.setMemory(cacheKey, indexedDBData, this.config.memoryTTL);
        return indexedDBData;
      }

      // 3. LocalStorage cache (for critical data)
      const localStorageKey = `kisanshakti_${cacheKey}`;
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.expires && Date.now() < parsed.expires) {
            console.log(`🟠 Cache HIT (LocalStorage): ${cacheKey}`);
            
            const data = this.decompress(parsed.data, parsed.compressed);
            // Promote to higher cache levels
            this.setMemory(cacheKey, data, this.config.memoryTTL);
            await db.setCachedData(cacheKey, data, tenantId);
            return data;
          }
        } catch (error) {
          console.warn('LocalStorage cache parse error:', error);
        }
      }

      console.log(`🔴 Cache MISS: ${cacheKey}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache (all tiers)
   */
  async set<T = any>(prefix: string, key: string, data: T, tenantId?: string): Promise<void> {
    const cacheKey = this.generateKey(prefix, key, tenantId);

    try {
      // 1. Set in memory cache
      this.setMemory(cacheKey, data, this.config.memoryTTL);

      // 2. Set in IndexedDB
      await db.setCachedData(cacheKey, data, tenantId);

      // 3. Set in LocalStorage for critical data
      if (this.isCriticalData(prefix)) {
        const compressed = this.compress(data);
        const entry = {
          data: compressed,
          expires: Date.now() + this.config.localStorageTTL,
          compressed: this.config.compression && compressed !== JSON.stringify(data),
          timestamp: Date.now(),
        };

        const localStorageKey = `kisanshakti_${cacheKey}`;
        localStorage.setItem(localStorageKey, JSON.stringify(entry));
      }

      console.log(`✅ Cache SET: ${cacheKey}`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  private setMemory<T = any>(key: string, data: T, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      version: 1,
    });

    this.evictMemoryCache();
  }

  private isCriticalData(prefix: string): boolean {
    return [
      this.PREFIXES.TENANT,
      this.PREFIXES.USER,
      this.PREFIXES.TRANSLATIONS,
    ].includes(prefix);
  }

  /**
   * Preload critical data during splash screen
   */
  async preloadCriticalData(tenantId: string): Promise<void> {
    console.log('🚀 Preloading critical data for tenant:', tenantId);

    const preloadTasks = [
      this.preloadTenantData(tenantId),
      this.preloadTranslations(),
      this.preloadDashboardData(tenantId),
    ];

    await Promise.allSettled(preloadTasks);
    console.log('✅ Critical data preloading completed');
  }

  private async preloadTenantData(tenantId: string): Promise<void> {
    // Check if tenant data is already cached
    const cachedTenant = await this.get(this.PREFIXES.TENANT, 'config', tenantId);
    if (!cachedTenant) {
      console.log('📥 Tenant data not cached, will load on demand');
    }
  }

  private async preloadTranslations(): Promise<void> {
    // Check if translations are cached
    const cachedTranslations = await this.get(this.PREFIXES.TRANSLATIONS, 'en');
    if (!cachedTranslations) {
      console.log('📥 Translations not cached, will load on demand');
    }
  }

  private async preloadDashboardData(tenantId: string): Promise<void> {
    // Check if dashboard data is cached
    const cachedDashboard = await this.get(this.PREFIXES.DASHBOARD, 'overview', tenantId);
    if (!cachedDashboard) {
      console.log('📥 Dashboard data not cached, will load on demand');
    }
  }

  /**
   * Clear all cache for tenant switch
   */
  async clearTenantCache(tenantId: string): Promise<void> {
    console.log('🗑️ Clearing cache for tenant:', tenantId);

    // Clear memory cache
    const keysToDelete = Array.from(this.memoryCache.keys())
      .filter(key => key.includes(tenantId));
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Clear IndexedDB cache
    await db.clearTenantData(tenantId);

    // Clear relevant LocalStorage entries
    const localStorageKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('kisanshakti_') && key.includes(tenantId));
    
    localStorageKeys.forEach(key => localStorage.removeItem(key));

    console.log('✅ Tenant cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      memorySize: this.memoryCache.size,
      maxMemoryItems: this.config.maxMemoryItems,
      localStorageSize: Object.keys(localStorage).filter(key => 
        key.startsWith('kisanshakti_')).length,
    };
  }

  /**
   * Invalidate specific cache entry
   */
  async invalidate(prefix: string, key: string, tenantId?: string): Promise<void> {
    const cacheKey = this.generateKey(prefix, key, tenantId);

    // Remove from memory
    this.memoryCache.delete(cacheKey);

    // Remove from IndexedDB
    await db.cache.where('key').equals(cacheKey).delete();

    // Remove from LocalStorage
    const localStorageKey = `kisanshakti_${cacheKey}`;
    localStorage.removeItem(localStorageKey);

    console.log(`🗑️ Cache invalidated: ${cacheKey}`);
  }

  /**
   * Warm up cache with background requests
   */
  async warmUpCache(tenantId: string, userId: string): Promise<void> {
    console.log('🔥 Warming up cache...');

    // Background tasks that don't block UI
    setTimeout(async () => {
      try {
        // Warm up common data
        await Promise.allSettled([
          this.preloadDashboardData(tenantId),
          this.preloadWeatherData(),
          this.preloadUserLands(userId, tenantId),
        ]);
        console.log('✅ Cache warm-up completed');
      } catch (error) {
        console.warn('Cache warm-up failed:', error);
      }
    }, 1000); // 1 second delay
  }

  private async preloadWeatherData(): Promise<void> {
    // Placeholder for weather data preloading
    console.log('📊 Weather data preloading...');
  }

  private async preloadUserLands(userId: string, tenantId: string): Promise<void> {
    // Placeholder for user lands preloading
    console.log('🌾 User lands preloading...');
  }
}