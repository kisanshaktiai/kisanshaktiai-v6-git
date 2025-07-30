
import { useUnifiedTenantData } from '@/hooks/useUnifiedTenantData';

interface TenantData {
  tenant: any;
  branding: any;
  features: any;
}

export class TenantDataService {
  private static instance: TenantDataService;
  private cache = new Map<string, TenantData>();

  static getInstance(): TenantDataService {
    if (!this.instance) {
      this.instance = new TenantDataService();
    }
    return this.instance;
  }

  async getTenantData(tenantId: string): Promise<TenantData | null> {
    if (this.cache.has(tenantId)) {
      return this.cache.get(tenantId)!;
    }

    try {
      // This would typically call an API
      // For now, we'll return null to maintain existing behavior
      return null;
    } catch (error) {
      console.error('Failed to fetch tenant data:', error);
      return null;
    }
  }

  cacheTenantData(tenantId: string, data: TenantData): void {
    this.cache.set(tenantId, data);
  }

  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.cache.delete(tenantId);
    } else {
      this.cache.clear();
    }
  }
}
