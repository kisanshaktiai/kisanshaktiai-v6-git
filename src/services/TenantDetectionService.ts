
import { supabase } from '@/integrations/supabase/client';

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

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (increased from 1 hour)
  private readonly TIMEOUT_DURATION = 2000; // 2 seconds (reduced from 5)
  private readonly MAX_RETRIES = 1; // Reduced from 3
  private readonly RETRY_DELAY = 500; // Reduced from 1000ms

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
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          await this.delay(this.RETRY_DELAY);
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
    const entry = this.cache.get(cacheKey);
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  private setCachedTenant(cacheKey: string, data: TenantData): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.CACHE_DURATION
    };
    
    this.cache.set(cacheKey, entry);
    
    // Also store in localStorage as backup
    try {
      localStorage.setItem(`tenant_cache_${cacheKey}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to store tenant in localStorage:', error);
    }
  }

  private getLocalStorageTenant(cacheKey: string): TenantData | null {
    try {
      const cached = localStorage.getItem(`tenant_cache_${cacheKey}`);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (this.isValidCacheEntry(entry)) {
          // Restore to memory cache
          this.cache.set(cacheKey, entry);
          return entry.data;
        } else {
          localStorage.removeItem(`tenant_cache_${cacheKey}`);
        }
      }
    } catch (error) {
      console.warn('Failed to load tenant from localStorage:', error);
    }
    return null;
  }

  private isDevelopmentEnvironment(hostname: string): boolean {
    return hostname === 'localhost' || 
           hostname.includes('lovable.app') || 
           hostname.includes('127.0.0.1') ||
           hostname.includes('localhost:') ||
           hostname.includes('.local');
  }

  async detectTenant(): Promise<TenantData | null> {
    const hostname = window.location.hostname;
    const cacheKey = this.getCacheKey(hostname);

    // PHASE 1: Check memory cache first
    const cachedTenant = this.getCachedTenant(cacheKey);
    if (cachedTenant) {
      console.log('Tenant loaded from memory cache:', cachedTenant.slug);
      return cachedTenant;
    }

    // PHASE 2: Check localStorage cache
    const localStorageTenant = this.getLocalStorageTenant(cacheKey);
    if (localStorageTenant) {
      console.log('Tenant loaded from localStorage cache:', localStorageTenant.slug);
      return localStorageTenant;
    }

    // PHASE 3: Fast-track for development environments
    if (this.isDevelopmentEnvironment(hostname)) {
      console.log('Development environment detected, using default tenant');
      const defaultTenant = await this.getDefaultTenant();
      if (defaultTenant) {
        this.setCachedTenant(cacheKey, defaultTenant);
        return defaultTenant;
      }
    }

    // PHASE 4: Try database detection with minimal retries
    try {
      const tenant = await this.performTenantDetection(hostname);
      
      if (tenant) {
        console.log('Tenant detected from database:', tenant.slug);
        this.setCachedTenant(cacheKey, tenant);
        return tenant;
      }
      
      // PHASE 5: Fallback to default tenant
      const defaultTenant = await this.getDefaultTenant();
      if (defaultTenant) {
        console.log('Using default tenant as fallback:', defaultTenant.slug);
        this.setCachedTenant(this.getCacheKey('default'), defaultTenant);
        return defaultTenant;
      }
      
      return null;
    } catch (error) {
      console.error('Tenant detection failed, using emergency fallback:', error);
      return this.getEmergencyFallback();
    }
  }

  private async performTenantDetection(hostname: string): Promise<TenantData | null> {
    try {
      // Simplified query - get tenant first, branding separately
      const { data: domainMapping } = await supabase
        .from('domain_mappings')
        .select(`
          tenant_id,
          tenants!inner(id, name, slug, type)
        `)
        .eq('domain', hostname)
        .eq('is_active', true)
        .single();

      if (domainMapping?.tenants) {
        const tenant = Array.isArray(domainMapping.tenants) 
          ? domainMapping.tenants[0] 
          : domainMapping.tenants;
        
        // Load branding separately and in parallel
        const brandingPromise = this.loadTenantBranding(tenant.id);
        const branding = await brandingPromise.catch(() => null);
        
        return {
          ...tenant,
          branding
        };
      }

      // Try subdomain lookup with simplified query
      const subdomain = hostname.split('.')[0];
      const { data: subdomainTenant } = await supabase
        .from('tenants')
        .select('id, name, slug, type')
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single();

      if (subdomainTenant) {
        // Load branding separately
        const branding = await this.loadTenantBranding(subdomainTenant.id).catch(() => null);
        return {
          ...subdomainTenant,
          branding
        };
      }

      return null;
    } catch (error) {
      console.error('Tenant detection query failed:', error);
      throw error;
    }
  }

  private async loadTenantBranding(tenantId: string): Promise<TenantBranding | null> {
    const { data: branding } = await supabase
      .from('tenant_branding')
      .select('logo_url, app_name, app_tagline, primary_color, secondary_color, background_color')
      .eq('tenant_id', tenantId)
      .single();

    return branding;
  }

  private async getDefaultTenant(): Promise<TenantData | null> {
    const defaultCacheKey = this.getCacheKey('default');
    
    // Check caches first
    const cached = this.getCachedTenant(defaultCacheKey) || this.getLocalStorageTenant(defaultCacheKey);
    if (cached) return cached;

    try {
      // Simplified query for default tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, slug, type')
        .eq('is_default', true)
        .eq('status', 'active')
        .single();

      if (tenant) {
        // Load branding separately
        const branding = await this.loadTenantBranding(tenant.id).catch(() => null);
        
        const defaultTenant = {
          ...tenant,
          is_default: true,
          branding
        };
        
        this.setCachedTenant(defaultCacheKey, defaultTenant);
        return defaultTenant;
      }
    } catch (error) {
      console.error('Failed to load default tenant:', error);
    }

    return this.createEmergencyTenant();
  }

  private getEmergencyFallback(): TenantData | null {
    // Try to get any cached tenant first
    for (const [key, entry] of this.cache.entries()) {
      if (this.isValidCacheEntry(entry)) {
        console.warn('Using emergency fallback tenant from cache:', entry.data.slug);
        return entry.data;
      }
    }

    // Try localStorage entries
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

    return this.createEmergencyTenant();
  }

  private createEmergencyTenant(): TenantData {
    console.warn('Creating emergency fallback tenant');
    const emergencyTenant = {
      id: 'emergency-tenant',
      name: 'KisanShakti AI',
      slug: 'emergency',
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
    this.setCachedTenant('emergency', emergencyTenant);
    return emergencyTenant;
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    
    // Also clear localStorage cache
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
    if (!this.getCachedTenant(cacheKey) && !this.getLocalStorageTenant(cacheKey)) {
      try {
        const tenant = await this.performTenantDetection(domain);
        if (tenant) {
          this.setCachedTenant(cacheKey, tenant);
          console.log('Tenant preloaded:', tenant.slug);
        }
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
