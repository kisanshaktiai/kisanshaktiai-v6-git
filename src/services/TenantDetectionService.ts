
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
  
  static getInstance(): TenantDetectionService {
    if (!TenantDetectionService.instance) {
      TenantDetectionService.instance = new TenantDetectionService();
    }
    return TenantDetectionService.instance;
  }

  async detectTenant(): Promise<DetectedTenant | null> {
    try {
      // Check for cached tenant first
      const { value: cachedTenantId } = await Preferences.get({ key: 'currentTenantId' });
      if (cachedTenantId) {
        console.log('Using cached tenant:', cachedTenantId);
        const tenant = await this.getTenantById(cachedTenantId);
        if (tenant) return tenant;
      }

      // Check for referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('tenant') || urlParams.get('ref');
      if (referralCode) {
        console.log('Using referral tenant:', referralCode);
        const tenant = await this.getTenantBySlug(referralCode);
        if (tenant) {
          await this.cacheTenant(tenant.id);
          return tenant;
        }
      }

      // Try geo-location based detection
      try {
        const location = await LocationService.getInstance().getCurrentLocation();
        const address = await LocationService.getInstance().reverseGeocode(
          location.latitude,
          location.longitude
        );
        
        const tenant = await this.getTenantByLocation(address.state, address.district);
        if (tenant) {
          await this.cacheTenant(tenant.id);
          return tenant;
        }
      } catch (error) {
        console.log('Location-based tenant detection failed:', error);
      }

      // Fallback to default tenant
      const defaultTenant = await this.getDefaultTenant();
      if (defaultTenant) {
        await this.cacheTenant(defaultTenant.id);
      }
      return defaultTenant;

    } catch (error) {
      console.error('Tenant detection error:', error);
      return await this.getDefaultTenant();
    }
  }

  private async getTenantById(tenantId: string): Promise<DetectedTenant | null> {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        console.warn('Tenant not found:', tenantError);
        return null;
      }

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
          background_color: branding.background_color
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      return null;
    }
  }

  private async getTenantBySlug(slug: string): Promise<DetectedTenant | null> {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (tenantError) {
        console.warn('Tenant not found by slug:', tenantError);
        return null;
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
          background_color: branding.background_color
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching tenant by slug:', error);
      return null;
    }
  }

  private async getTenantByLocation(state: string, district: string): Promise<DetectedTenant | null> {
    // This can be enhanced with actual location-based tenant mapping
    // For now, return null to fallback to default
    return null;
  }

  private async cacheTenant(tenantId: string): Promise<void> {
    await Preferences.set({
      key: 'currentTenantId',
      value: tenantId
    });
  }

  private async getDefaultTenant(): Promise<DetectedTenant> {
    try {
      // Try to fetch the default tenant from database
      const defaultTenant = await this.getTenantById('default');
      if (defaultTenant) {
        return defaultTenant;
      }
    } catch (error) {
      console.error('Error fetching default tenant:', error);
    }

    // Fallback to hardcoded default
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
}
