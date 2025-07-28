
interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  version?: number;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_default?: boolean;
  branding?: TenantBranding;
  branding_version?: number;
  branding_updated_at?: string;
}

interface CacheEntry {
  data: TenantData;
  timestamp: number;
  expires: number;
  version: number;
  branding_version?: number;
}

interface DetectionResponse {
  success: boolean;
  data: TenantData;
  method: string;
  fallback_reason?: string;
  error?: string;
}

interface VersionCheckResponse {
  success: boolean;
  needsRefresh: boolean;
  currentVersion?: number;
  cachedVersion?: number;
  reason?: string;
  error?: string;
}

// Sentry/LogRocket integration for production error tracking
interface ErrorTrackingService {
  captureException: (error: Error, context?: any) => void;
  addBreadcrumb: (breadcrumb: any) => void;
  setContext: (context: string, data: any) => void;
}

declare global {
  interface Window {
    Sentry?: ErrorTrackingService;
    LogRocket?: {
      captureException: (error: Error) => void;
      track: (event: string, properties?: any) => void;
    };
  }
}

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TIMEOUT_DURATION = 5000; // 5 seconds for Edge Function
  private readonly MAX_RETRIES = 2;
  private readonly VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private versionCheckTimers = new Map<string, number>();

  static getInstance(): TenantDetectionService {
    if (!this.instance) {
      this.instance = new TenantDetectionService();
    }
    return this.instance;
  }

  private logAnalyticsEvent(eventType: string, data: any) {
    // Log to browser console for development
    console.log(`📊 Tenant Analytics [${eventType}]:`, data);

    // Send to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'tenant-detection',
        message: `${eventType}: ${data.domain || 'unknown'} -> ${data.method || 'unknown'}`,
        level: eventType === 'error' ? 'error' : 'info',
        data: data
      });

      if (eventType === 'fallback' || eventType === 'error' || eventType === 'emergency') {
        window.Sentry.setContext('tenant-detection', data);
      }
    }

    // Send to LogRocket if available
    if (typeof window !== 'undefined' && window.LogRocket) {
      window.LogRocket.track(`tenant-detection-${eventType}`, {
        ...data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  private captureError(error: Error, context: any) {
    console.error('🔥 Tenant Detection Error:', error, context);
    
    // Log analytics event for error
    this.logAnalyticsEvent('error', {
      ...context,
      error: error.message,
      stack: error.stack
    });

    if (typeof window !== 'undefined') {
      // Send to Sentry
      if (window.Sentry) {
        window.Sentry.setContext('tenant-detection-error', context);
        window.Sentry.captureException(error);
      }

      // Send to LogRocket
      if (window.LogRocket) {
        window.LogRocket.captureException(error);
      }
    }
  }

  private parseHostname(): { hostname: string; subdomain: string | null; domain: string } {
    const hostname = window.location.hostname;
    
    // Remove port if present (shouldn't be in hostname, but just in case)
    const cleanHostname = hostname.split(':')[0];
    
    // Split by dots
    const parts = cleanHostname.split('.');
    
    if (parts.length <= 2) {
      // No subdomain (e.g., example.com or localhost)
      return {
        hostname: cleanHostname,
        subdomain: null,
        domain: cleanHostname
      };
    }
    
    // Extract subdomain and main domain
    const subdomain = parts[0];
    const domain = parts.slice(1).join('.');
    
    console.log('Parsed hostname:', { hostname: cleanHostname, subdomain, domain });
    
    return {
      hostname: cleanHostname,
      subdomain,
      domain
    };
  }

  private isDevelopmentDomain(domain: string): boolean {
    return domain === 'localhost' || 
           domain.includes('lovableproject.com') || 
           domain.includes('lovable.app') ||
           domain.includes('127.0.0.1') ||
           domain.includes('localhost:') ||
           domain.includes('.local') ||
           domain.includes('192.168.') ||
           domain.includes('10.0.') ||
           domain === '0.0.0.0';
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

  private getCacheKey(hostname: string): string {
    return `tenant:${hostname}`;
  }

  private isValidCacheEntry(entry: CacheEntry, skipVersionCheck: boolean = false): boolean {
    const isTimeValid = Date.now() < entry.expires;
    if (!isTimeValid) return false;
    
    // Skip version check if explicitly requested (to avoid infinite loops)
    if (skipVersionCheck) return true;
    
    // Check if we should validate version
    const hostname = this.getHostnameFromCacheKey(entry);
    if (hostname && this.shouldCheckVersion(hostname)) {
      this.scheduleVersionCheck(hostname, entry);
    }
    
    return true;
  }

  private getHostnameFromCacheKey(entry: CacheEntry): string | null {
    // Extract hostname from cache key - this is a simplified approach
    for (const [key, cachedEntry] of this.cache.entries()) {
      if (cachedEntry === entry) {
        return key.replace('tenant:', '');
      }
    }
    return null;
  }

  private shouldCheckVersion(hostname: string): boolean {
    const lastCheck = this.versionCheckTimers.get(hostname);
    return !lastCheck || (Date.now() - lastCheck) > this.VERSION_CHECK_INTERVAL;
  }

  private scheduleVersionCheck(hostname: string, entry: CacheEntry): void {
    // Don't check too frequently
    if (!this.shouldCheckVersion(hostname)) return;
    
    this.versionCheckTimers.set(hostname, Date.now());
    
    // Perform version check asynchronously
    this.checkCacheVersion(hostname, entry.branding_version || entry.version)
      .then(needsRefresh => {
        if (needsRefresh) {
          console.log(`Cache version mismatch for ${hostname}, invalidating cache`);
          this.invalidateCacheForHostname(hostname);
        }
      })
      .catch(error => {
        console.warn(`Version check failed for ${hostname}:`, error);
      });
  }

  private async checkCacheVersion(hostname: string, cachedVersion?: number): Promise<boolean> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('check-tenant-version', {
        body: { domain: hostname, cachedVersion }
      });

      if (error) {
        console.warn('Version check error:', error);
        return false; // Don't invalidate on error
      }

      const response = data as VersionCheckResponse;
      return response.success ? response.needsRefresh : false;
    } catch (error) {
      console.warn('Failed to check cache version:', error);
      return false; // Don't invalidate on error
    }
  }

  private invalidateCacheForHostname(hostname: string): void {
    const cacheKey = this.getCacheKey(hostname);
    this.cache.delete(cacheKey);
    
    // Also remove from localStorage
    try {
      localStorage.removeItem(`tenant_cache_${cacheKey}`);
      
      // Log analytics event
      this.logAnalyticsEvent('cache-invalidation', {
        hostname,
        reason: 'version-mismatch',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  private getCachedTenant(cacheKey: string): TenantData | null {
    // Check memory cache first
    const entry = this.cache.get(cacheKey);
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    
    if (entry && !this.isValidCacheEntry(entry, true)) {
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
      expires: Date.now() + this.CACHE_DURATION,
      version: 1, // Cache entry version
      branding_version: data.branding_version
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

  private async callDetectTenantFunction(hostname: string): Promise<TenantData> {
    try {
      // Import supabase client only when needed
      const { supabase } = await import('@/integrations/supabase/client');
      
      console.log('Calling detect-tenant function with hostname:', hostname);
      
      const { data, error } = await supabase.functions.invoke('detect-tenant', {
        body: { domain: hostname },
        headers: {
          'x-session-id': crypto.randomUUID()
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        this.captureError(new Error(`Tenant detection failed: ${error.message}`), {
          hostname,
          error: error.message
        });
        throw new Error(`Tenant detection failed: ${error.message}`);
      }

      const response = data as DetectionResponse;
      
      if (!response.success || !response.data) {
        const errorMsg = 'Invalid response from tenant detection service';
        this.captureError(new Error(errorMsg), { hostname, response });
        throw new Error(errorMsg);
      }

      console.log(`Tenant detected via ${response.method}:`, response.data.slug);
      
      // Log analytics based on response
      if (response.fallback_reason) {
        this.logAnalyticsEvent('fallback', {
          domain: hostname,
          method: response.method,
          fallback_reason: response.fallback_reason,
          tenant_slug: response.data.slug,
          tenant_id: response.data.id
        });
      } else {
        this.logAnalyticsEvent('success', {
          domain: hostname,
          method: response.method,
          tenant_slug: response.data.slug,
          tenant_id: response.data.id
        });
      }
      
      if (response.error) {
        console.warn('Detection warning:', response.error);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to call detect-tenant function:', error);
      this.captureError(error as Error, { hostname });
      throw error;
    }
  }

  async detectTenant(): Promise<TenantData | null> {
    const { hostname } = this.parseHostname();
    
    // Fast-track for development environments - return emergency tenant immediately
    if (this.isDevelopmentDomain(hostname)) {
      console.log('🔧 Development environment detected, using emergency tenant immediately');
      const emergencyTenant = this.createEmergencyTenant();
      
      this.logAnalyticsEvent('development-fallback', {
        domain: hostname,
        tenant_slug: emergencyTenant.slug,
        tenant_id: emergencyTenant.id
      });
      
      return emergencyTenant;
    }

    const cacheKey = this.getCacheKey(hostname);

    // Check cache first (memory + localStorage)
    const cachedTenant = this.getCachedTenant(cacheKey);
    if (cachedTenant) {
      console.log('Tenant loaded from cache:', cachedTenant.slug);
      
      this.logAnalyticsEvent('cache-hit', {
        domain: hostname,
        tenant_slug: cachedTenant.slug,
        tenant_id: cachedTenant.id
      });
      
      return cachedTenant;
    }

    // Call Edge Function with retry logic (production only)
    try {
      const tenant = await this.withRetry(() => this.callDetectTenantFunction(hostname));
      
      // Cache the result
      this.setCachedTenant(cacheKey, tenant);
      
      return tenant;
    } catch (error) {
      console.error('All tenant detection attempts failed:', error);
      
      this.captureError(error as Error, {
        hostname,
        context: 'detection-failure'
      });
      
      // Try to get any cached tenant as last resort
      const emergencyTenant = this.getEmergencyFallbackFromCache();
      if (emergencyTenant) {
        console.warn('Using emergency cached tenant:', emergencyTenant.slug);
        
        this.logAnalyticsEvent('emergency', {
          domain: hostname,
          fallback_reason: 'All detection failed, using cached emergency tenant',
          tenant_slug: emergencyTenant.slug,
          tenant_id: emergencyTenant.id
        });
        
        return emergencyTenant;
      }
      
      // Return client-side emergency tenant
      const clientEmergency = this.createEmergencyTenant();
      
      this.logAnalyticsEvent('emergency', {
        domain: hostname,
        fallback_reason: 'All detection failed, using client-side emergency tenant',
        tenant_slug: clientEmergency.slug,
        tenant_id: clientEmergency.id
      });
      
      return clientEmergency;
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
      branding_version: 1,
      branding_updated_at: new Date().toISOString(),
      branding: {
        app_name: 'KisanShakti AI',
        app_tagline: 'Your smart farming journey starts here',
        primary_color: '#8BC34A',
        secondary_color: '#4CAF50',
        background_color: '#FFFFFF',
        logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
        version: 1
      }
    };

    // Cache the emergency tenant
    this.setCachedTenant('emergency-client', emergencyTenant);
    return emergencyTenant;
  }

  async forceRefreshTenant(hostname?: string): Promise<TenantData | null> {
    const targetHostname = hostname || this.parseHostname().hostname;
    const cacheKey = this.getCacheKey(targetHostname);
    
    // Clear existing cache
    this.invalidateCacheForHostname(targetHostname);
    
    // Fetch fresh data
    try {
      const tenant = await this.callDetectTenantFunction(targetHostname);
      this.setCachedTenant(cacheKey, tenant);
      console.log('Tenant force refreshed:', tenant.slug);
      
      this.logAnalyticsEvent('force-refresh', {
        domain: targetHostname,
        tenant_slug: tenant.slug,
        tenant_id: tenant.id
      });
      
      return tenant;
    } catch (error) {
      console.error('Failed to force refresh tenant:', error);
      this.captureError(error as Error, { hostname: targetHostname, context: 'force-refresh' });
      return null;
    }
  }

  async validateCacheVersion(hostname?: string): Promise<boolean> {
    const targetHostname = hostname || this.parseHostname().hostname;
    const cacheKey = this.getCacheKey(targetHostname);
    const cachedEntry = this.cache.get(cacheKey);
    
    if (!cachedEntry) return false;
    
    try {
      const needsRefresh = await this.checkCacheVersion(
        targetHostname, 
        cachedEntry.branding_version || cachedEntry.version
      );
      
      if (needsRefresh) {
        this.invalidateCacheForHostname(targetHostname);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Cache validation failed:', error);
      return false;
    }
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
      
      this.logAnalyticsEvent('cache-clear', {
        cleared_keys: keysToRemove.length,
        timestamp: new Date().toISOString()
      });
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
        
        this.logAnalyticsEvent('preload', {
          domain,
          tenant_slug: tenant.slug,
          tenant_id: tenant.id
        });
      } catch (error) {
        console.warn('Failed to preload tenant for domain:', domain, error);
        this.captureError(error as Error, { domain, context: 'preload' });
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
      
      this.logAnalyticsEvent('cache-cleanup', {
        expired_keys_removed: expiredKeys.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to cleanup localStorage cache:', error);
    }

    console.log('Cache cleanup completed');
  }
}
