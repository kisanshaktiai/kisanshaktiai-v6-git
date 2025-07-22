
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';

// Simple, explicit type definitions to avoid circular references
interface BrandingData {
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

interface FeaturesData {
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  basic_analytics: boolean;
}

interface CachedTenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
  branding: BrandingData;
  features: FeaturesData;
}

export class TenantCacheService {
  private static instance: TenantCacheService;
  private currentTenant: CachedTenantData | null = null;

  static getInstance(): TenantCacheService {
    if (!TenantCacheService.instance) {
      TenantCacheService.instance = new TenantCacheService();
    }
    return TenantCacheService.instance;
  }

  async loadTenantData(): Promise<CachedTenantData | null> {
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

  private async fetchDefaultTenant(): Promise<CachedTenantData | null> {
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

      return this.buildTenantData(tenant);
    } catch (error) {
      console.error('Error fetching default tenant:', error);
      return null;
    }
  }

  private async fetchTenantFromDatabase(tenantId: string): Promise<CachedTenantData | null> {
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

      return this.buildTenantData(tenant);
    } catch (error) {
      console.error('Error fetching tenant from database:', error);
      return null;
    }
  }

  private async buildTenantData(tenant: any): Promise<CachedTenantData> {
    const { data: branding } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single();

    const { data: features } = await supabase
      .from('tenant_features')
      .select('*')  
      .eq('tenant_id', tenant.id)
      .single();

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      type: tenant.type,
      status: tenant.status,
      subscription_plan: tenant.subscription_plan,
      branding: branding || this.getDefaultBranding(),
      features: features || this.getDefaultFeatures()
    };
  }

  private async getCachedTenantData(tenantId: string): Promise<CachedTenantData | null> {
    try {
      const cachedData = await secureStorage.getObject(`tenant_data_${tenantId}`);
      return cachedData as CachedTenantData | null;
    } catch (error) {
      console.error('Error getting cached tenant data:', error);
      return null;
    }
  }

  private async cacheTenantData(tenantData: CachedTenantData): Promise<void> {
    try {
      await secureStorage.setObject(`tenant_data_${tenantData.id}`, tenantData);
      console.log('Tenant data cached successfully');
    } catch (error) {
      console.error('Error caching tenant data:', error);
    }
  }

  private getDefaultBranding(): BrandingData {
    return {
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
  }

  private getDefaultFeatures(): FeaturesData {
    return {
      ai_chat: true,
      weather_forecast: true,
      marketplace: true,
      community_forum: true,
      satellite_imagery: true,
      soil_testing: true,
      basic_analytics: true
    };
  }

  getCurrentTenant(): CachedTenantData | null {
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
