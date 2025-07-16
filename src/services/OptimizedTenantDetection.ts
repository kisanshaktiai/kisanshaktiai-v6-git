
import { Preferences } from '@capacitor/preferences';
import { LocationService } from './LocationService';
import { supabase } from '@/integrations/supabase/client';

interface DetectedTenant {
  id: string;
  name: string;
  slug: string;
  branding?: {
    logo_url?: string;
    app_name?: string;
    app_tagline?: string;
    primary_color?: string;
    background_color?: string;
    secondary_color?: string;
    accent_color?: string;
    text_color?: string;
    font_family?: string;
  };
}

interface TenantCache {
  tenant: DetectedTenant;
  timestamp: number;
  ttl: number; // Time to live in ms
}

export class OptimizedTenantDetection {
  private static instance: OptimizedTenantDetection;
  private cache = new Map<string, TenantCache>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly NETWORK_TIMEOUT = 5000; // 5 seconds
  
  static getInstance(): OptimizedTenantDetection {
    if (!OptimizedTenantDetection.instance) {
      OptimizedTenantDetection.instance = new OptimizedTenantDetection();
    }
    return OptimizedTenantDetection.instance;
  }

  async detectTenant(): Promise<DetectedTenant | null> {
    try {
      // Strategy 1: Check memory cache first
      const cachedTenant = await this.getCachedTenant();
      if (cachedTenant) {
        console.log('Using cached tenant:', cachedTenant.id);
        return cachedTenant;
      }

      // Strategy 2: Check persistent storage
      const storedTenant = await this.getStoredTenant();
      if (storedTenant) {
        console.log('Using stored tenant:', storedTenant.id);
        this.setCachedTenant('stored', storedTenant);
        return storedTenant;
      }

      // Strategy 3: Parallel detection with timeout
      const detectionPromises = [
        this.detectFromURL(),
        this.detectFromLocation(),
        this.getDefaultTenant()
      ];

      const tenant = await this.raceWithTimeout(detectionPromises, this.NETWORK_TIMEOUT);
      
      if (tenant) {
        await this.storeTenant(tenant);
        this.setCachedTenant('detected', tenant);
        return tenant;
      }

      // Fallback to default
      const defaultTenant = await this.getDefaultTenant();
      if (defaultTenant) {
        await this.storeTenant(defaultTenant);
        this.setCachedTenant('default', defaultTenant);
      }
      return defaultTenant;

    } catch (error) {
      console.error('Optimized tenant detection error:', error);
      return await this.getDefaultTenant();
    }
  }

  private async getCachedTenant(): Promise<DetectedTenant | null> {
    const cacheEntries = Array.from(this.cache.values());
    const validEntry = cacheEntries.find(entry => 
      Date.now() - entry.timestamp < entry.ttl
    );
    return validEntry?.tenant || null;
  }

  private setCachedTenant(key: string, tenant: DetectedTenant): void {
    this.cache.set(key, {
      tenant,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  private async getStoredTenant(): Promise<DetectedTenant | null> {
    try {
      const { value: cachedTenantId } = await Preferences.get({ key: 'currentTenantId' });
      const { value: cachedData } = await Preferences.get({ key: 'tenantData' });
      const { value: cacheTimestamp } = await Preferences.get({ key: 'tenantCacheTime' });
      
      if (cachedTenantId && cachedData && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp);
        if (Date.now() - timestamp < this.CACHE_TTL) {
          return JSON.parse(cachedData);
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading stored tenant:', error);
      return null;
    }
  }

  private async storeTenant(tenant: DetectedTenant): Promise<void> {
    try {
      await Promise.all([
        Preferences.set({ key: 'currentTenantId', value: tenant.id }),
        Preferences.set({ key: 'tenantData', value: JSON.stringify(tenant) }),
        Preferences.set({ key: 'tenantCacheTime', value: Date.now().toString() })
      ]);
    } catch (error) {
      console.error('Error storing tenant:', error);
    }
  }

  private async detectFromURL(): Promise<DetectedTenant | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('tenant') || urlParams.get('ref');
    
    if (referralCode) {
      console.log('Detecting tenant from URL:', referralCode);
      return await this.getTenantBySlug(referralCode);
    }
    return null;
  }

  private async detectFromLocation(): Promise<DetectedTenant | null> {
    try {
      const location = await LocationService.getInstance().getCurrentLocation();
      const address = await LocationService.getInstance().reverseGeocode(
        location.latitude,
        location.longitude
      );
      
      return await this.getTenantByLocation(address.state, address.district);
    } catch (error) {
      console.log('Location-based tenant detection failed:', error);
      return null;
    }
  }

  private async raceWithTimeout<T>(promises: Promise<T>[], timeout: number): Promise<T | null> {
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), timeout)
    );
    
    const results = await Promise.allSettled([
      Promise.race([...promises, timeoutPromise]),
      ...promises
    ]);
    
    // Return first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }
    return null;
  }

  private async getTenantBySlug(slug: string): Promise<DetectedTenant | null> {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) return null;

      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        branding: branding || undefined
      };
    } catch (error) {
      console.error('Error fetching tenant by slug:', error);
      return null;
    }
  }

  private async getTenantByLocation(state: string, district: string): Promise<DetectedTenant | null> {
    // Implement location-based tenant mapping if needed
    return null;
  }

  private async getDefaultTenant(): Promise<DetectedTenant> {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', 'default')
        .single();

      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', 'default')
        .single();

      if (tenant) {
        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          branding: branding || undefined
        };
      }
    } catch (error) {
      console.error('Error fetching default tenant:', error);
    }

    // Hardcoded fallback
    return {
      id: 'default',
      name: 'VisionAi Solutions Pvt Ltd',
      slug: 'default',
      branding: {
        logo_url: '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
        app_name: 'KisanShaktiAI',
        app_tagline: 'Intelligent Guru for Farmers',
        primary_color: '#4D7C0F',
        background_color: '#FFFFFF'
      }
    };
  }

  // Clear cache when needed
  clearCache(): void {
    this.cache.clear();
  }

  // Preload tenant data in background
  async preloadTenant(tenantId: string): Promise<void> {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenant) {
        const { data: branding } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        const tenantData: DetectedTenant = {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          branding: branding || undefined
        };

        this.setCachedTenant(`preload_${tenantId}`, tenantData);
      }
    } catch (error) {
      console.error('Error preloading tenant:', error);
    }
  }
}
