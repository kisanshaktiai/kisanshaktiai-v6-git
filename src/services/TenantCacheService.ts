
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';

// Simple, explicit types to avoid TypeScript inference issues
export interface SimpleTenantBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  app_name: string;
  app_tagline: string;
  logo_url: string;
  splash_screen_url?: string;
}

export interface SimpleTenantFeatures {
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  basic_analytics: boolean;
}

export interface SimpleTenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
  branding: SimpleTenantBranding;
  features: SimpleTenantFeatures;
}

export class TenantCacheService {
  private static instance: TenantCacheService;
  private currentTenant: SimpleTenant | null = null;

  static getInstance(): TenantCacheService {
    if (!TenantCacheService.instance) {
      TenantCacheService.instance = new TenantCacheService();
    }
    return TenantCacheService.instance;
  }

  async loadTenantData(): Promise<SimpleTenant | null> {
    try {
      // First check if we have a cached tenant ID
      const cachedTenantId = await secureStorage.get('current_tenant_id');
      
      if (cachedTenantId) {
        console.log('Found cached tenant ID:', cachedTenantId);
        
        // Try to load cached tenant data
        const cachedTenant = await this.getCachedTenantData(cachedTenantId);
        if (cachedTenant) {
          console.log('Using cached tenant data');
          this.currentTenant = cachedTenant;
          return cachedTenant;
        }
        
        // If cached data is missing, fetch from database
        const tenantData = await this.fetchTenantFromDatabase(cachedTenantId);
        if (tenantData) {
          await this.cacheTenantData(tenantData);
          this.currentTenant = tenantData;
          return tenantData;
        }
      }

      // No cached tenant or cached tenant not found, fetch default tenant
      console.log('Loading default tenant');
      const defaultTenant = await this.fetchDefaultTenant();
      if (defaultTenant) {
        await this.cacheTenantData(defaultTenant);
        await secureStorage.set('current_tenant_id', defaultTenant.id);
        this.currentTenant = defaultTenant;
        return defaultTenant;
      }

      return null;
    } catch (error) {
      console.error('Error loading tenant data:', error);
      return null;
    }
  }

  private async fetchDefaultTenant(): Promise<SimpleTenant | null> {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_default', true)
        .eq('status', 'active')
        .single();

      if (tenantError || !tenant) {
        console.error('Default tenant not found:', tenantError);
        return null;
      }

      return await this.buildTenantData(tenant);
    } catch (error) {
      console.error('Error fetching default tenant:', error);
      return null;
    }
  }

  private async fetchTenantFromDatabase(tenantId: string): Promise<SimpleTenant | null> {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .eq('status', 'active')
        .single();

      if (tenantError || !tenant) {
        console.error('Tenant not found:', tenantError);
        return null;
      }

      return await this.buildTenantData(tenant);
    } catch (error) {
      console.error('Error fetching tenant from database:', error);
      return null;
    }
  }

  private async buildTenantData(tenantRow: any): Promise<SimpleTenant> {
    // Fetch branding data
    const brandingQuery = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantRow.id)
      .single();

    // Fetch features data
    const featuresQuery = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenantRow.id)
      .single();

    const defaultBranding: SimpleTenantBranding = {
      primary_color: '#8BC34A',
      secondary_color: '#4CAF50',
      accent_color: '#689F38',
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      app_name: 'KisanShakti AI',
      app_tagline: 'INTELLIGENT AI GURU FOR FARMERS',
      logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      splash_screen_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
    };

    const defaultFeatures: SimpleTenantFeatures = {
      ai_chat: true,
      weather_forecast: true,
      marketplace: true,
      community_forum: true,
      satellite_imagery: true,
      soil_testing: true,
      basic_analytics: true
    };

    const branding = brandingQuery.data || defaultBranding;
    const features = featuresQuery.data || defaultFeatures;

    const tenantBranding: SimpleTenantBranding = {
      primary_color: branding.primary_color || defaultBranding.primary_color,
      secondary_color: branding.secondary_color || defaultBranding.secondary_color,
      accent_color: branding.accent_color || defaultBranding.accent_color,
      background_color: branding.background_color || defaultBranding.background_color,
      text_color: branding.text_color || defaultBranding.text_color,
      app_name: branding.app_name || defaultBranding.app_name,
      app_tagline: branding.app_tagline || defaultBranding.app_tagline,
      logo_url: branding.logo_url || defaultBranding.logo_url,
      splash_screen_url: branding.splash_screen_url || defaultBranding.splash_screen_url
    };

    const tenantFeatures: SimpleTenantFeatures = {
      ai_chat: features.ai_chat ?? defaultFeatures.ai_chat,
      weather_forecast: features.weather_forecast ?? defaultFeatures.weather_forecast,
      marketplace: features.marketplace ?? defaultFeatures.marketplace,
      community_forum: features.community_forum ?? defaultFeatures.community_forum,
      satellite_imagery: features.satellite_imagery ?? defaultFeatures.satellite_imagery,
      soil_testing: features.soil_testing ?? defaultFeatures.soil_testing,
      basic_analytics: features.basic_analytics ?? defaultFeatures.basic_analytics
    };

    return {
      id: tenantRow.id,
      name: tenantRow.name,
      slug: tenantRow.slug,
      type: tenantRow.type,
      status: tenantRow.status,
      subscription_plan: tenantRow.subscription_plan,
      branding: tenantBranding,
      features: tenantFeatures
    };
  }

  private async getCachedTenantData(tenantId: string): Promise<SimpleTenant | null> {
    try {
      const cachedData = await secureStorage.getObject(`tenant_data_${tenantId}`);
      return cachedData as SimpleTenant | null;
    } catch (error) {
      console.error('Error getting cached tenant data:', error);
      return null;
    }
  }

  private async cacheTenantData(tenantData: SimpleTenant): Promise<void> {
    try {
      await secureStorage.setObject(`tenant_data_${tenantData.id}`, tenantData);
      console.log('Tenant data cached successfully');
    } catch (error) {
      console.error('Error caching tenant data:', error);
    }
  }

  getCurrentTenant(): SimpleTenant | null {
    return this.currentTenant;
  }

  async switchTenant(tenantId: string): Promise<boolean> {
    try {
      const tenantData = await this.fetchTenantFromDatabase(tenantId);
      if (tenantData) {
        await this.cacheTenantData(tenantData);
        await secureStorage.set('current_tenant_id', tenantId);
        this.currentTenant = tenantData;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error switching tenant:', error);
      return false;
    }
  }
}

export const tenantCacheService = TenantCacheService.getInstance();
