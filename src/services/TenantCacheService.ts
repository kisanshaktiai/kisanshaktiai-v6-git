
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';
import type { SimpleTenantData } from '@/types/tenantCache';
import { TenantDataBuilder } from './tenant/TenantDataBuilder';
import { TenantDataFetcher } from './tenant/TenantDataFetcher';

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
      const tenantRow = await TenantDataFetcher.fetchDefaultTenantFromDb();
      if (!tenantRow) {
        return null;
      }

      return this.buildTenantFromRow(tenantRow);
    } catch (error) {
      console.error('Error fetching default tenant:', error);
      return null;
    }
  }

  private async fetchTenantFromDatabase(tenantId: string): Promise<SimpleTenantData | null> {
    try {
      const tenantRow = await TenantDataFetcher.fetchTenantByIdFromDb(tenantId);
      if (!tenantRow) {
        return null;
      }

      return this.buildTenantFromRow(tenantRow);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  private async buildTenantFromRow(tenantRow: any): Promise<SimpleTenantData> {
    const [brandingData, featuresData] = await Promise.all([
      TenantDataFetcher.fetchBrandingData(tenantRow.id),
      TenantDataFetcher.fetchFeaturesData(tenantRow.id)
    ]);

    return TenantDataBuilder.buildTenantData(tenantRow, brandingData, featuresData);
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
