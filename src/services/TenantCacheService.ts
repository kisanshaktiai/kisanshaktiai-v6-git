
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';
import type { TenantBrandingData, TenantFeaturesData, SimpleTenantData } from '@/types/tenantCache';

// Basic tenant data from database
interface BasicTenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
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
        console.log('Found cached tenant ID:', cachedTenantId);

        const cachedTenant = await this.getCachedTenantData(cachedTenantId);
        if (cachedTenant) {
          console.log('Using cached tenant data');
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

  private async fetchDefaultTenant(): Promise<SimpleTenantData | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('is_default', true)
        .eq('status', 'active')
        .limit(1)
        .single();
        
      if (error || !data) {
        console.log('Default tenant not found, trying first active tenant');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tenants')
          .select('id, name, slug, type, status, subscription_plan')
          .eq('status', 'active')
          .limit(1)
          .single();
          
        if (fallbackError || !fallbackData) {
          console.error('No active tenants found');
          return null;
        }
        
        return this.buildTenantFromBasicData(fallbackData);
      }

      return this.buildTenantFromBasicData(data);
    } catch (error) {
      console.error('Error fetching default tenant:', error);
      return null;
    }
  }

  private async fetchTenantFromDatabase(tenantId: string): Promise<SimpleTenantData | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('id', tenantId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        console.error('Tenant not found:', error);
        return null;
      }

      return this.buildTenantFromBasicData(data);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  private async buildTenantFromBasicData(tenantRow: BasicTenant): Promise<SimpleTenantData> {
    const [brandingData, featuresData] = await Promise.all([
      this.fetchBrandingData(tenantRow.id),
      this.fetchFeaturesData(tenantRow.id)
    ]);

    const branding = this.createBrandingObject(brandingData, tenantRow.name);
    const features = this.createFeaturesObject(featuresData);

    const tenantData: SimpleTenantData = {
      id: tenantRow.id,
      name: tenantRow.name,
      slug: tenantRow.slug,
      type: tenantRow.type,
      status: tenantRow.status,
      subscription_plan: tenantRow.subscription_plan,
      branding: branding,
      features: features
    };

    return tenantData;
  }

  private async fetchBrandingData(tenantId: string) {
    const { data } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    return data;
  }

  private async fetchFeaturesData(tenantId: string) {
    const { data } = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    return data;
  }

  private createBrandingObject(brandingData: any, tenantName: string): TenantBrandingData {
    return {
      primary_color: brandingData?.primary_color || '#8BC34A',
      secondary_color: brandingData?.secondary_color || '#4CAF50',
      accent_color: brandingData?.accent_color || '#689F38',
      background_color: brandingData?.background_color || '#FFFFFF',
      text_color: brandingData?.text_color || '#1F2937',
      app_name: brandingData?.app_name || tenantName || 'KisanShakti AI',
      app_tagline: brandingData?.app_tagline || 'INTELLIGENT AI GURU FOR FARMERS',
      logo_url: brandingData?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      splash_screen_url: brandingData?.splash_screen_url || brandingData?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
    };
  }

  private createFeaturesObject(featuresData: any): TenantFeaturesData {
    return {
      ai_chat: featuresData?.ai_chat ?? true,
      weather_forecast: featuresData?.weather_forecast ?? true,
      marketplace: featuresData?.marketplace ?? true,
      community_forum: featuresData?.community_forum ?? true,
      satellite_imagery: featuresData?.satellite_imagery ?? true,
      soil_testing: featuresData?.soil_testing ?? true,
      basic_analytics: featuresData?.basic_analytics ?? true
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
      console.log('Tenant data cached successfully');
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
