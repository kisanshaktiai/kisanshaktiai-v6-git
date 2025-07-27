
interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_default?: boolean;
  branding?: TenantBranding;
}

interface CacheEntry {
  data: TenantData;
  timestamp: number;
  expires: number;
}

interface DetectionResponse {
  success: boolean;
  data: TenantData;
  method: string;
  error?: string;
}

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TIMEOUT_DURATION = 5000; // 5 seconds for Edge Function
  private readonly MAX_RETRIES = 2; // Reduced since Edge Function is more reliable

  static getInstance(): TenantDetectionService {
    if (!this.instance) {
      this.instance = new TenantDetectionService();
    }
    return this.instance;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.withTimeout(operation(), this.TIMEOUT_DURATION);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Tenant detection attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          await this.delay(500 * attempt); // Progressive backoff
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(domain: string): string {
    return `tenant:${domain}`;
  }

  private isValidCacheEntry(entry: CacheEntry): boolean {
    return Date.now() < entry.expires;
  }

  private getCachedTenant(cacheKey: string): TenantData | null {
    // Check memory cache first
    const entry = this.cache.get(cacheKey);
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(cacheKey);
    }
    
    // Check localStorage cache
    try {
      const cached = localStorage.getItem(`tenant_cache_${cacheKey}`);
      if (cached) {
        const storedEntry: CacheEntry = JSON.parse(cached);
        if (this.isValidCacheEntry(storedEntry)) {
          // Restore to memory cache
          this.cache.set(cacheKey, storedEntry);
          return storedEntry.data;
        } else {
          localStorage.removeItem(`tenant_cache_${cacheKey}`);
        }
      }
    } catch (error) {
      console.warn('Failed to load tenant from localStorage:', error);
    }
    
    return null;
  }

  private setCachedTenant(cacheKey: string, data: TenantData): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.CACHE_DURATION
    };
    
    // Store in memory cache
    this.cache.set(cacheKey, entry);
    
    // Store in localStorage as backup
    try {
      localStorage.setItem(`tenant_cache_${cacheKey}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to store tenant in localStorage:', error);
    }
  }

  private async callDetectTenantFunction(domain: string): Promise<TenantData> {
    try {
      // Import supabase client only when needed
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('detect-tenant', {
        body: { domain }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Tenant detection failed: ${error.message}`);
      }

      const response = data as DetectionResponse;
      
      if (!response.success || !response.data) {
        throw new Error('Invalid response from tenant detection service');
      }

      console.log(`Tenant detected via ${response.method}:`, response.data.slug);
      
      if (response.error) {
        console.warn('Detection warning:', response.error);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to call detect-tenant function:', error);
      throw error;
    }
  }

  async detectTenant(): Promise<TenantData | null> {
    const hostname = window.location.hostname;
    const cacheKey = this.getCacheKey(hostname);

    // Check cache first (memory + localStorage)
    const cachedTenant = this.getCachedTenant(cacheKey);
    if (cachedTenant) {
      console.log('Tenant loaded from cache:', cachedTenant.slug);
      return cachedTenant;
    }

    // Call Edge Function with retry logic
    try {
      const tenant = await this.withRetry(() => this.callDetectTenantFunction(hostname));
      
      // Cache the result
      this.setCachedTenant(cacheKey, tenant);
      
      return tenant;
    } catch (error) {
      console.error('All tenant detection attempts failed:', error);
      
      // Try to get any cached tenant as last resort
      const emergencyTenant = this.getEmergencyFallbackFromCache();
      if (emergencyTenant) {
        console.warn('Using emergency cached tenant:', emergencyTenant.slug);
        return emergencyTenant;
      }
      
      // Return client-side emergency tenant
      return this.createEmergencyTenant();
    }
  }

  private getEmergencyFallbackFromCache(): TenantData | null {
    // Try to get any valid cached tenant
    for (const [key, entry] of this.cache.entries()) {
      if (this.isValidCacheEntry(entry)) {
        console.warn('Using emergency fallback tenant from cache:', entry.data.slug);
        return entry.data;
      }
    }

    // Check localStorage for any cached tenant
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tenant_cache_')) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            if (this.isValidCacheEntry(entry)) {
              console.warn('Using emergency fallback from localStorage:', entry.data.slug);
              return entry.data;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check localStorage for emergency fallback:', error);
    }

    return null;
  }

  private createEmergencyTenant(): TenantData {
    console.warn('Creating client-side emergency fallback tenant');
    const emergencyTenant = {
      id: 'emergency-client-tenant',
      name: 'KisanShakti AI',
      slug: 'emergency-client',
      type: 'default',
      is_default: true,
      branding: {
        app_name: 'KisanShakti AI',
        app_tagline: 'Your smart farming journey starts here',
        primary_color: '#8BC34A',
        secondary_color: '#4CAF50',
        background_color: '#FFFFFF',
        logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
      }
    };

    // Cache the emergency tenant
    this.setCachedTenant('emergency-client', emergencyTenant);
    return emergencyTenant;
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    
    // Clear localStorage cache
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tenant_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
    
    console.log('All tenant caches cleared');
  }

  async preloadTenant(domain: string): Promise<void> {
    const cacheKey = this.getCacheKey(domain);
    if (!this.getCachedTenant(cacheKey)) {
      try {
        const tenant = await this.callDetectTenantFunction(domain);
        this.setCachedTenant(cacheKey, tenant);
        console.log('Tenant preloaded:', tenant.slug);
      } catch (error) {
        console.warn('Failed to preload tenant for domain:', domain, error);
      }
    }
  }

  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      validEntries: 0,
      expiredEntries: 0
    };

    for (const entry of this.cache.values()) {
      if (this.isValidCacheEntry(entry)) {
        stats.validEntries++;
      } else {
        stats.expiredEntries++;
      }
    }

    return stats;
  }

  async cleanup(): Promise<void> {
    // Clean up memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidCacheEntry(entry)) {
        this.cache.delete(key);
      }
    }

    // Clean up localStorage cache
    try {
      const expiredKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tenant_cache_')) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            if (!this.isValidCacheEntry(entry)) {
              expiredKeys.push(key);
            }
          }
        }
      }
      expiredKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to cleanup localStorage cache:', error);
    }

    console.log('Cache cleanup completed');
  }
}
