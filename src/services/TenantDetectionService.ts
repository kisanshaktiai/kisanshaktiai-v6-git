
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
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly TIMEOUT_DURATION = 5000; // 5 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

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
          await this.delay(this.RETRY_DELAY * Math.pow(2, attempt - 1));
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
  }

  async detectTenant(): Promise<TenantData | null> {
    const hostname = window.location.hostname;
    const cacheKey = this.getCacheKey(hostname);

    // Try memory cache first
    const cachedTenant = this.getCachedTenant(cacheKey);
    if (cachedTenant) {
      console.log('Tenant loaded from memory cache:', cachedTenant.slug);
      return cachedTenant;
    }

    // Detect tenant with retry logic
    try {
      const tenant = await this.withRetry(() => this.performTenantDetection(hostname));
      
      if (tenant) {
        console.log('Tenant detected:', tenant.slug);
        this.setCachedTenant(cacheKey, tenant);
        return tenant;
      }
      
      // Fallback to default tenant
      const defaultTenant = await this.getDefaultTenant();
      if (defaultTenant) {
        console.log('Using default tenant:', defaultTenant.slug);
        this.setCachedTenant(this.getCacheKey('default'), defaultTenant);
        return defaultTenant;
      }
      
      return null;
    } catch (error) {
      console.error('Tenant detection failed completely:', error);
      return this.getEmergencyFallback();
    }
  }

  private async performTenantDetection(hostname: string): Promise<TenantData | null> {
    // Skip domain detection for localhost and development
    if (hostname === 'localhost' || hostname.includes('lovable.app')) {
      return this.getDefaultTenant();
    }

    try {
      // First try domain mapping
      const { data: domainMapping } = await supabase
        .from('domain_mappings')
        .select(`
          tenant_id,
          tenants!inner(
            id,
            name,
            slug,
            type,
            tenant_branding(
              logo_url,
              app_name,
              app_tagline,
              primary_color,
              secondary_color,
              background_color
            )
          )
        `)
        .eq('domain', hostname)
        .eq('is_active', true)
        .single();

      if (domainMapping?.tenants) {
        const tenant = Array.isArray(domainMapping.tenants) 
          ? domainMapping.tenants[0] 
          : domainMapping.tenants;
        
        return this.formatTenantData(tenant);
      }

      // Try subdomain if no domain mapping
      const subdomain = hostname.split('.')[0];
      const { data: subdomainTenant } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          slug,
          type,
          tenant_branding(
            logo_url,
            app_name,
            app_tagline,
            primary_color,
            secondary_color,
            background_color
          )
        `)
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single();

      return subdomainTenant ? this.formatTenantData(subdomainTenant) : null;
    } catch (error) {
      console.error('Tenant detection query failed:', error);
      throw error;
    }
  }

  private async getDefaultTenant(): Promise<TenantData | null> {
    const defaultCacheKey = this.getCacheKey('default');
    
    // Check memory cache
    const cached = this.getCachedTenant(defaultCacheKey);
    if (cached) return cached;

    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          slug,
          type,
          tenant_branding(
            logo_url,
            app_name,
            app_tagline,
            primary_color,
            secondary_color,
            background_color
          )
        `)
        .eq('is_default', true)
        .eq('status', 'active')
        .single();

      if (tenant) {
        const defaultTenant = this.formatTenantData(tenant);
        defaultTenant.is_default = true;
        this.setCachedTenant(defaultCacheKey, defaultTenant);
        return defaultTenant;
      }
    } catch (error) {
      console.error('Failed to load default tenant:', error);
    }

    return this.createEmergencyTenant();
  }

  private formatTenantData(tenant: any): TenantData {
    const branding = Array.isArray(tenant.tenant_branding) 
      ? tenant.tenant_branding[0] 
      : tenant.tenant_branding;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      type: tenant.type,
      branding: branding ? {
        logo_url: branding.logo_url,
        app_name: branding.app_name,
        app_tagline: branding.app_tagline,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        background_color: branding.background_color
      } : undefined
    };
  }

  private getEmergencyFallback(): TenantData | null {
    // Try to get any cached tenant
    for (const [key, entry] of this.cache.entries()) {
      if (this.isValidCacheEntry(entry)) {
        console.warn('Using emergency fallback tenant from cache:', entry.data.slug);
        return entry.data;
      }
    }

    return this.createEmergencyTenant();
  }

  private createEmergencyTenant(): TenantData {
    console.warn('Creating emergency fallback tenant');
    return {
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
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    console.log('Tenant detection cache cleared');
  }

  async preloadTenant(domain: string): Promise<void> {
    const cacheKey = this.getCacheKey(domain);
    if (!this.getCachedTenant(cacheKey)) {
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

    console.log('Memory cache cleaned up');
  }
}
