
import { supabase } from '@/integrations/supabase/client';
import { tenantManager } from './TenantManager';
import { offlineManager } from './OfflineManager';

interface ApiOptions {
  useCache?: boolean;
  cacheKey?: string;
  requireOnline?: boolean;
}

class TenantApiService {
  private static instance: TenantApiService;

  static getInstance(): TenantApiService {
    if (!TenantApiService.instance) {
      TenantApiService.instance = new TenantApiService();
    }
    return TenantApiService.instance;
  }

  // Generic query method with tenant isolation
  async queryWithTenant<T>(
    table: string,
    query: any,
    options: ApiOptions = {}
  ): Promise<{ data: T[] | null; error: any; fromCache?: boolean }> {
    const tenantId = tenantManager.getCurrentTenantId();
    const cacheKey = options.cacheKey || `${table}_${tenantId}_${JSON.stringify(query)}`;

    // Try cache first if offline or cache requested
    if ((offlineManager.isOffline() || options.useCache) && !options.requireOnline) {
      const cachedData = await offlineManager.getCachedData(cacheKey);
      if (cachedData) {
        console.log('TenantApiService: Returning cached data for:', table);
        return { data: cachedData, error: null, fromCache: true };
      }
    }

    // If offline and no cache, return error
    if (offlineManager.isOffline() && options.requireOnline) {
      return { 
        data: null, 
        error: { message: 'This operation requires internet connection' }
      };
    }

    try {
      // Add tenant filter to query
      const { data, error } = await supabase
        .from(table)
        .select(query.select || '*')
        .eq('tenant_id', tenantId)
        .then(q => {
          // Apply additional filters
          if (query.filters) {
            Object.entries(query.filters).forEach(([key, value]) => {
              q = q.eq(key, value);
            });
          }
          return q;
        });

      if (error) {
        console.error('TenantApiService: Query error:', error);
        return { data: null, error };
      }

      // Cache the result
      if (data && options.useCache !== false) {
        await offlineManager.setCachedData(cacheKey, data);
      }

      return { data, error: null };

    } catch (error) {
      console.error('TenantApiService: Network error:', error);
      
      // Try to return cached data as fallback
      const cachedData = await offlineManager.getCachedData(cacheKey);
      if (cachedData) {
        return { data: cachedData, error: null, fromCache: true };
      }

      return { data: null, error };
    }
  }

  // Mutation method with offline queue support
  async mutateWithTenant(
    operation: 'create' | 'update' | 'delete',
    table: string,
    data: any,
    options: ApiOptions = {}
  ): Promise<{ data: any; error: any }> {
    const tenantId = tenantManager.getCurrentTenantId();
    
    // Add tenant_id to data for create/update operations
    if (operation !== 'delete') {
      data.tenant_id = tenantId;
    }

    // If offline, queue for later sync
    if (offlineManager.isOffline()) {
      await offlineManager.queueForSync(operation, table, data);
      
      // Return optimistic response
      return { 
        data: { ...data, id: data.id || crypto.randomUUID() }, 
        error: null 
      };
    }

    try {
      let result;
      switch (operation) {
        case 'create':
          result = await supabase.from(table).insert(data).select();
          break;
        case 'update':
          result = await supabase.from(table)
            .update(data)
            .eq('id', data.id)
            .eq('tenant_id', tenantId)
            .select();
          break;
        case 'delete':
          result = await supabase.from(table)
            .delete()
            .eq('id', data.id)
            .eq('tenant_id', tenantId);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (result.error) {
        // Queue for retry if it's a network error
        if (result.error.code === 'PGRST301' || result.error.message.includes('network')) {
          await offlineManager.queueForSync(operation, table, data);
        }
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };

    } catch (error) {
      console.error('TenantApiService: Mutation error:', error);
      
      // Queue for retry on network errors
      await offlineManager.queueForSync(operation, table, data);
      return { data: null, error };
    }
  }

  // Specific API methods
  async getLands(farmerId: string) {
    return this.queryWithTenant('lands', {
      select: '*',
      filters: { farmer_id: farmerId }
    }, { useCache: true, cacheKey: `lands_${farmerId}` });
  }

  async getCropHistory(landId: string) {
    return this.queryWithTenant('crop_history', {
      select: '*',
      filters: { land_id: landId }
    }, { useCache: true, cacheKey: `crop_history_${landId}` });
  }

  async getHealthAssessments(landId: string) {
    return this.queryWithTenant('crop_health_assessments', {
      select: '*',
      filters: { land_id: landId }
    }, { useCache: true, cacheKey: `health_assessments_${landId}` });
  }

  async getFinancialTransactions(farmerId: string) {
    return this.queryWithTenant('financial_transactions', {
      select: '*',
      filters: { farmer_id: farmerId }
    }, { useCache: true, cacheKey: `transactions_${farmerId}` });
  }

  async createLand(landData: any) {
    return this.mutateWithTenant('create', 'lands', landData);
  }

  async updateLand(landId: string, updates: any) {
    return this.mutateWithTenant('update', 'lands', { id: landId, ...updates });
  }

  async deleteLand(landId: string) {
    return this.mutateWithTenant('delete', 'lands', { id: landId });
  }

  async createFinancialTransaction(transactionData: any) {
    return this.mutateWithTenant('create', 'financial_transactions', transactionData);
  }

  async callEdgeFunction(functionName: string, payload: any = {}) {
    const tenantId = tenantManager.getCurrentTenantId();
    
    // Add tenant context to payload
    const enrichedPayload = {
      ...payload,
      tenant_id: tenantId,
      tenant_context: {
        features: tenantManager.getTenantFeatures(),
        branding: tenantManager.getTenantBranding()
      }
    };

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: enrichedPayload
      });

      if (error) {
        console.error('TenantApiService: Edge function error:', error);
        return { data: null, error };
      }

      return { data, error: null };

    } catch (error) {
      console.error('TenantApiService: Edge function network error:', error);
      return { data: null, error };
    }
  }
}

export const tenantApiService = TenantApiService.getInstance();
