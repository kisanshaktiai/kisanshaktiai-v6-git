import { secureStorage } from '@/services/storage/secureStorage';

interface TenantBranding {
  app_name: string;
  app_tagline: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

interface TenantFeatures {
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  basic_analytics: boolean;
}

interface TenantData {
  id: string;
  name: string;
  branding: TenantBranding;
  features: TenantFeatures;
}

export class TenantCacheService {
  private static instance: TenantCacheService;
  private currentTenant: TenantData | null = null;

  static getInstance(): TenantCacheService {
    if (!TenantCacheService.instance) {
      TenantCacheService.instance = new TenantCacheService();
    }
    return TenantCacheService.instance;
  }

  async loadTenantData(): Promise<TenantData | null> {
    try {
      // First check if we have a cached tenant ID
      const cachedTenantId = await secureStorage.getItem('current_tenant_id');
      
      if (cachedTenantId) {
        console.log('Found cached tenant ID:', cachedTenantId);
        
        // Try to load cached tenant data
        const cachedTenant = await this.getCachedTenantData(cachedTenantId);
        if (cachedTenant) {
          console.log('Using cached tenant data');
          this.currentTenant = cachedTenant;
          return cachedTenant;
        }
      }

      // No cached tenant or cached tenant not found, fetch default tenant from API
      console.log('Loading default tenant from API');
      const defaultTenant = await this.fetchDefaultTenantFromAPI();
      if (defaultTenant) {
        await this.cacheTenantData(defaultTenant);
        await secureStorage.setItem('current_tenant_id', defaultTenant.id);
        this.currentTenant = defaultTenant;
        return defaultTenant;
      }

      // Fallback to hardcoded default
      const fallbackTenant = this.getFallbackTenant();
      this.currentTenant = fallbackTenant;
      return fallbackTenant;

    } catch (error) {
      console.error('Error loading tenant data:', error);
      // Return fallback data to prevent complete failure
      const fallbackTenant = this.getFallbackTenant();
      this.currentTenant = fallbackTenant;
      return fallbackTenant;
    }
  }

  private async fetchDefaultTenantFromAPI(): Promise<TenantData | null> {
    try {
      const response = await fetch('https://qfklkkzxemsbeniyugiz.supabase.co/functions/v1/tenant-default', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API response not ok:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('Received tenant data from API:', data);
      return data;
    } catch (error) {
      console.error('Error fetching default tenant from API:', error);
      return null;
    }
  }

  private async getCachedTenantData(tenantId: string): Promise<TenantData | null> {
    try {
      const cachedData = await secureStorage.getObject(`tenant_data_${tenantId}`);
      return cachedData as TenantData | null;
    } catch (error) {
      console.error('Error getting cached tenant data:', error);
      return null;
    }
  }

  private async cacheTenantData(tenantData: TenantData): Promise<void> {
    try {
      await secureStorage.setObject(`tenant_data_${tenantData.id}`, tenantData);
      console.log('Tenant data cached successfully');
    } catch (error) {
      console.error('Error caching tenant data:', error);
    }
  }

  private getFallbackTenant(): TenantData {
    return {
      id: 'default',
      name: 'KisanShakti AI',
      branding: {
        app_name: 'KisanShakti AI',
        app_tagline: 'INTELLIGENT AI GURU FOR FARMERS',
        logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
        primary_color: '#8BC34A',
        secondary_color: '#4CAF50',
        accent_color: '#689F38',
        background_color: '#FFFFFF',
        text_color: '#1F2937'
      },
      features: {
        ai_chat: true,
        weather_forecast: true,
        marketplace: true,
        community_forum: true,
        satellite_imagery: true,
        soil_testing: true,
        basic_analytics: true
      }
    };
  }

  getCurrentTenant(): TenantData | null {
    return this.currentTenant;
  }

  async switchTenant(tenantId: string): Promise<boolean> {
    try {
      // For now, we only support switching to default tenant via API
      if (tenantId === 'default') {
        const tenantData = await this.fetchDefaultTenantFromAPI();
        if (tenantData) {
          await this.cacheTenantData(tenantData);
          await secureStorage.setItem('current_tenant_id', tenantId);
          this.currentTenant = tenantData;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error switching tenant:', error);
      return false;
    }
  }
}

export const tenantCacheService = TenantCacheService.getInstance();
