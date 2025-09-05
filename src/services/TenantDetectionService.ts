import { applyTenantTheme } from '@/utils/tenantTheme';

interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  version?: number;
}

interface TenantFeatures {
  core_chat_enabled?: boolean;
  weather_enabled?: boolean;
  marketplace_enabled?: boolean;
  analytics_enabled?: boolean;
  satellite_monitoring_enabled?: boolean;
  [key: string]: boolean | undefined;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  status?: string;
  branding?: TenantBranding;
  features?: TenantFeatures;
  branding_version?: number;
  branding_updated_at?: string;
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
  fallback_reason?: string;
  error?: string;
}

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for production
  private readonly TIMEOUT_DURATION = 5000; // 5 seconds
  private readonly MAX_RETRIES = 2;
  private currentTenant: TenantData | null = null;

  static getInstance(): TenantDetectionService {
    if (!this.instance) {
      this.instance = new TenantDetectionService();
    }
    return this.instance;
  }

  private parseHostname(): { hostname: string; subdomain: string | null; domain: string } {
    const hostname = window.location.hostname;
    const cleanHostname = hostname.split(':')[0];
    const parts = cleanHostname.split('.');
    
    if (parts.length <= 2) {
      return {
        hostname: cleanHostname,
        subdomain: null,
        domain: cleanHostname
      };
    }
    
    const subdomain = parts[0];
    const domain = parts.slice(1).join('.');
    
    return {
      hostname: cleanHostname,
      subdomain,
      domain
    };
  }

  private getCacheKey(hostname: string): string {
    return `tenant:${hostname}`;
  }

  private getCachedTenant(cacheKey: string): TenantData | null {
    const entry = this.cache.get(cacheKey);
    if (entry && Date.now() < entry.expires) {
      return entry.data;
    }
    
    // Check localStorage
    try {
      const cached = localStorage.getItem(`tenant_cache_${cacheKey}`);
      if (cached) {
        const storedEntry: CacheEntry = JSON.parse(cached);
        if (Date.now() < storedEntry.expires) {
          this.cache.set(cacheKey, storedEntry);
          return storedEntry.data;
        }
        localStorage.removeItem(`tenant_cache_${cacheKey}`);
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
    
    this.cache.set(cacheKey, entry);
    
    try {
      localStorage.setItem(`tenant_cache_${cacheKey}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to store tenant in localStorage:', error);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  private async callDetectTenantFunction(hostname: string): Promise<TenantData> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      console.log('🔍 Detecting tenant for domain:', hostname);
      
      const { data, error } = await supabase.functions.invoke('detect-tenant', {
        body: { domain: hostname }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Tenant detection failed: ${error.message}`);
      }

      const response = data as DetectionResponse;
      
      if (!response.success || !response.data) {
        throw new Error('Invalid response from tenant detection service');
      }

      console.log(`✅ Tenant detected via ${response.method}:`, response.data.slug);
      
      return response.data;
    } catch (error) {
      console.error('Failed to detect tenant:', error);
      throw error;
    }
  }

  async detectTenant(): Promise<TenantData> {
    const { hostname } = this.parseHostname();
    const cacheKey = this.getCacheKey(hostname);

    // Check cache first
    const cachedTenant = this.getCachedTenant(cacheKey);
    if (cachedTenant) {
      console.log('📦 Tenant loaded from cache:', cachedTenant.slug);
      this.currentTenant = cachedTenant;
      this.applyTenantBranding(cachedTenant);
      return cachedTenant;
    }

    // Call Edge Function with retry
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const tenant = await this.withTimeout(
          this.callDetectTenantFunction(hostname),
          this.TIMEOUT_DURATION
        );
        
        // Cache the result
        this.setCachedTenant(cacheKey, tenant);
        this.currentTenant = tenant;
        this.applyTenantBranding(tenant);
        
        return tenant;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Tenant detection attempt ${attempt}/${this.MAX_RETRIES} failed:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    console.error('All tenant detection attempts failed:', lastError);
    throw lastError || new Error('Tenant detection failed');
  }

  private applyTenantBranding(tenant: TenantData): void {
    if (!tenant.branding) return;

    console.log('🎨 Applying tenant branding:', tenant.slug);
    
    // Apply theme colors
    applyTenantTheme(tenant.branding);

    // Update document title
    if (tenant.branding.app_name) {
      document.title = tenant.branding.app_name;
    }

    // Update favicon if provided
    if (tenant.branding.logo_url) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = tenant.branding.logo_url;
      }
    }

    // Update meta theme color
    const metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (metaThemeColor && tenant.branding.primary_color) {
      metaThemeColor.content = tenant.branding.primary_color;
    }
  }

  async forceRefreshTenant(): Promise<TenantData> {
    const { hostname } = this.parseHostname();
    const cacheKey = this.getCacheKey(hostname);
    
    // Clear cache
    this.cache.delete(cacheKey);
    try {
      localStorage.removeItem(`tenant_cache_${cacheKey}`);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
    
    // Re-detect
    return this.detectTenant();
  }

  getCurrentTenant(): TenantData | null {
    return this.currentTenant;
  }

  clearCache(): void {
    this.cache.clear();
    
    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('tenant_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
    
    this.currentTenant = null;
  }

  async preloadTenant(domain: string): Promise<void> {
    try {
      const tenant = await this.callDetectTenantFunction(domain);
      const cacheKey = this.getCacheKey(domain);
      this.setCachedTenant(cacheKey, tenant);
    } catch (error) {
      console.warn(`Failed to preload tenant for ${domain}:`, error);
    }
  }
}