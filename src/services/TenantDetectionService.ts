
// Enhanced TenantDetectionService with Build-Time Config Support

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
  };
}

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  private cachedTenant: DetectedTenant | null = null;
  
  static getInstance(): TenantDetectionService {
    if (!TenantDetectionService.instance) {
      TenantDetectionService.instance = new TenantDetectionService();
    }
    return TenantDetectionService.instance;
  }

  async detectTenant(): Promise<DetectedTenant | null> {
    try {
      // PRIORITY 1: Check build-time environment variables (BEST for white-label)
      const buildTimeTenantId = import.meta.env.VITE_TENANT_ID;
      const buildTimeTenantSlug = import.meta.env.VITE_TENANT_SLUG;
      
      if (buildTimeTenantId || buildTimeTenantSlug) {
        console.log('Using build-time tenant configuration');
        const tenant = buildTimeTenantId 
          ? await this.getTenantById(buildTimeTenantId)
          : await this.getTenantBySlug(buildTimeTenantSlug);
          
        if (tenant) {
          await this.cacheTenant(tenant.id);
          this.cachedTenant = tenant;
          return tenant;
        }
      }

      // PRIORITY 2: Check cached tenant (for multi-tenant builds)
      if (this.cachedTenant) {
        return this.cachedTenant;
      }

      const { value: cachedTenantId } = await Preferences.get({ key: 'currentTenantId' });
      if (cachedTenantId) {
        console.log('Using cached tenant:', cachedTenantId);
        const tenant = await this.getTenantById(cachedTenantId);
        if (tenant) {
          this.cachedTenant = tenant;
          return tenant;
        }
      }

      // PRIORITY 3: URL-based detection (for web/universal links)
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('tenant') || urlParams.get('ref');
      if (referralCode) {
        console.log('Using URL tenant:', referralCode);
        const tenant = await this.getTenantBySlug(referralCode);
        if (tenant) {
          await this.cacheTenant(tenant.id);
          this.cachedTenant = tenant;
          return tenant;
        }
      }

      // PRIORITY 4: Location-based detection (fallback)
      try {
        const location = await LocationService.getInstance().getCurrentLocation();
        const address = await LocationService.getInstance().reverseGeocode(
          location.latitude,
          location.longitude
        );
        
        const tenant = await this.getTenantByLocation(address.state, address.district);
        if (tenant) {
          await this.cacheTenant(tenant.id);
          this.cachedTenant = tenant;
          return tenant;
        }
      } catch (error) {
        console.log('Location-based detection failed:', error);
      }

      // PRIORITY 5: Default tenant
      const defaultTenant = await this.getDefaultTenant();
      if (defaultTenant) {
        await this.cacheTenant(defaultTenant.id);
        this.cachedTenant = defaultTenant;
      }
      return defaultTenant;

    } catch (error) {
      console.error('Tenant detection error:', error);
      return await this.getDefaultTenant();
    }
  }

  // Get tenant with branding data
  private async getTenantById(tenantId: string): Promise<DetectedTenant | null> {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .eq('status', 'active') // Only active tenants
        .single();

      if (tenantError) {
        console.warn('Tenant not found:', tenantError);
        return null;
      }

      // Fetch branding data
      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        branding: branding ? {
          logo_url: branding.logo_url,
          app_name: branding.app_name,
          app_tagline: branding.app_tagline,
          primary_color: branding.primary_color,
          background_color: branding.background_color,
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      return null;
    }
  }

  private async getTenantBySlug(slug: string): Promise<DetectedTenant | null> {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
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
        branding: branding ? {
          logo_url: branding.logo_url,
          app_name: branding.app_name,
          app_tagline: branding.app_tagline,
          primary_color: branding.primary_color,
          background_color: branding.background_color,
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching tenant by slug:', error);
      return null;
    }
  }

  private async getTenantByLocation(state: string, district: string): Promise<DetectedTenant | null> {
    // Implementation for location-based detection
    return null;
  }

  private async getDefaultTenant(): Promise<DetectedTenant | null> {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', 'default')
        .single();

      if (!tenant) {
        // Fallback to hardcoded default if no default tenant in DB
        return {
          id: 'default',
          name: 'KisanShakti AI',
          slug: 'default',
          branding: {
            logo_url: '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
            app_name: 'KisanShaktiAI',
            app_tagline: 'Intelligent Guru for Farmers',
            primary_color: '#4D7C0F',
            background_color: '#FFFFFF',
          }
        };
      }

      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        branding: branding ? {
          logo_url: branding.logo_url,
          app_name: branding.app_name,
          app_tagline: branding.app_tagline,
          primary_color: branding.primary_color,
          background_color: branding.background_color,
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching default tenant:', error);
      // Return hardcoded fallback
      return {
        id: 'default',
        name: 'KisanShakti AI',
        slug: 'default',
        branding: {
          logo_url: '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
          app_name: 'KisanShaktiAI',
          app_tagline: 'Intelligent Guru for Farmers',
          primary_color: '#4D7C0F',
          background_color: '#FFFFFF',
        }
      };
    }
  }

  private async cacheTenant(tenantId: string): Promise<void> {
    await Preferences.set({
      key: 'currentTenantId',
      value: tenantId
    });
  }

  // Method to pre-cache branding for offline use
  async preCacheBranding(tenantId: string): Promise<void> {
    try {
      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (branding) {
        await Preferences.set({
          key: `tenant_branding_${tenantId}`,
          value: JSON.stringify(branding)
        });
      }
    } catch (error) {
      console.error('Error caching branding:', error);
    }
  }

  // Get cached branding for offline use
  async getCachedBranding(tenantId: string): Promise<any> {
    try {
      const { value } = await Preferences.get({ key: `tenant_branding_${tenantId}` });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting cached branding:', error);
      return null;
    }
  }

  // Clear cache method
  async clearCache(): Promise<void> {
    this.cachedTenant = null;
    await Preferences.remove({ key: 'currentTenantId' });
  }
}
