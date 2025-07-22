import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';

// Flattened Tenant Branding Interface
export interface FlatTenantBrandingData {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  app_name: string;
  app_tagline?: string;
  logo_url?: string;
  splash_screen_url?: string;
}

// Flattened Tenant Features Interface
export interface FlatTenantFeaturesData {
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  basic_analytics: boolean;
}

// Simplified Tenant Data Interface
export interface SimpleTenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
  branding: FlatTenantBrandingData;
  features: FlatTenantFeaturesData;
}

// Explicit type for database tenant row
interface DatabaseTenantRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
  [key: string]: any;
}

export class TenantCacheService {
  private static instance: TenantCacheService;
  private currentTenant: SimpleTenantData | null = null;

  static getInstance(): TenantCacheService {
    if (!TenantCacheService.instance) {
      TenantCacheService.instance = new TenantCacheService();
    }
    return TenantCacheService.instance;
  }

  async loadTenantData(): Promise<SimpleTenantData | null> {
    try {
      const cachedTenantId = await secureStorage.get('current_tenant_id');

      if (cachedTenantId) {
        const cachedTenant = await this.getCachedTenantData(cachedTenantId);
        if (cachedTenant) {
          this.currentTenant = cachedTenant;
          return cachedTenant;
        }

        const tenantData = await this.fetchTenantFromDatabase(cachedTenantId);
        if (tenantData) {
          await this.cacheTenantData(tenantData);
          this.currentTenant = tenantData;
          return tenantData;
        }
      }

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

  private async fetchDefaultTenant(): Promise<SimpleTenantData | null> {
    const { data, error } = await supabase
      .from<DatabaseTenantRow>('tenants')
      .select('*')
      .eq('is_default', true)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.error('Default tenant not found:', error);
      return null;
    }

    return this.createTenantData(data);
  }

  private async fetchTenantFromDatabase(tenantId: string): Promise<SimpleTenantData | null> {
    const { data, error } = await supabase
      .from<DatabaseTenantRow>('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.error('Tenant not found:', error);
      return null;
    }

    return this.createTenantData(data);
  }

  private createTenantData(tenantRow: DatabaseTenantRow): SimpleTenantData {
    const branding: FlatTenantBrandingData = {
      primary_color: tenantRow.primary_color || '#8BC34A',
      secondary_color: tenantRow.secondary_color || '#4CAF50',
      accent_color: tenantRow.accent_color || '#689F38',
      background_color: tenantRow.background_color || '#FFFFFF',
      text_color: tenantRow.text_color || '#1F2937',
      app_name: tenantRow.app_name || 'KisanShakti AI',
      app_tagline: tenantRow.app_tagline || 'INTELLIGENT AI GURU FOR FARMERS',
      logo_url: tenantRow.logo_url,
      splash_screen_url: tenantRow.splash_screen_url
    };

    const features: FlatTenantFeaturesData = {
      ai_chat: tenantRow.ai_chat ?? true,
      weather_forecast: tenantRow.weather_forecast ?? true,
      marketplace: tenantRow.marketplace ?? true,
      community_forum: tenantRow.community_forum ?? true,
      satellite_imagery: tenantRow.satellite_imagery ?? false,
      soil_testing: tenantRow.soil_testing ?? false,
      basic_analytics: tenantRow.basic_analytics ?? true
    };

    return {
      id: tenantRow.id,
      name: tenantRow.name,
      slug: tenantRow.slug,
      type: tenantRow.type,
      status: tenantRow.status,
      subscription_plan: tenantRow.subscription_plan,
      branding,
      features
    };
  }

  private async getCachedTenantData(tenantId: string): Promise<SimpleTenantData | null> {
    try {
      const cachedData = await secureStorage.getObject(`tenant_data_${tenantId}`);
      return cachedData as SimpleTenantData | null;
    } catch (error) {
      console.error('Error getting cached tenant data:', error);
      return null;
    }
  }

  private async cacheTenantData(tenantData: SimpleTenantData): Promise<void> {
    try {
      await secureStorage.setObject(`tenant_data_${tenantData.id}`, tenantData);
    } catch (error) {
      console.error('Error caching tenant data:', error);
    }
  }

  getCurrentTenant(): SimpleTenantData | null {
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
