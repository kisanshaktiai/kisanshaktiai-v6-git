
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';

interface DefaultTenant {
  id: string;
  name: string;
  slug: string;
  is_default: boolean;
}

class DefaultTenantService {
  private static instance: DefaultTenantService;
  private cachedTenantId: string | null = null;
  private readonly STORAGE_KEY = 'default_tenant_id';

  static getInstance(): DefaultTenantService {
    if (!DefaultTenantService.instance) {
      DefaultTenantService.instance = new DefaultTenantService();
    }
    return DefaultTenantService.instance;
  }

  async getDefaultTenantId(): Promise<string | null> {
    try {
      // Check cached value first
      if (this.cachedTenantId) {
        return this.cachedTenantId;
      }

      // Check local storage
      const stored = await secureStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.cachedTenantId = stored;
        return stored;
      }

      // Fetch from database
      console.log('Fetching default tenant from database...');
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, slug, is_default')
        .eq('is_default', true)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching default tenant:', error);
        return null;
      }

      if (tenant) {
        console.log('Default tenant found:', tenant);
        this.cachedTenantId = tenant.id;
        await secureStorage.setItem(this.STORAGE_KEY, tenant.id);
        return tenant.id;
      }

      console.warn('No default tenant found in database');
      return null;
    } catch (error) {
      console.error('Error in getDefaultTenantId:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    this.cachedTenantId = null;
    await secureStorage.removeItem(this.STORAGE_KEY);
  }
}

export const defaultTenantService = DefaultTenantService.getInstance();
