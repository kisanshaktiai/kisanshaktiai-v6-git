
import { supabase } from '@/integrations/supabase/client';

interface BasicTenantRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
}

export class TenantDataFetcher {
  static async fetchBrandingData(tenantId: string) {
    const { data } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    return data;
  }

  static async fetchFeaturesData(tenantId: string) {
    const { data } = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    return data;
  }

  static async fetchTenantByIdFromDb(tenantId: string): Promise<BasicTenantRow | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('id', tenantId)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) {
        console.error('Tenant not found:', error);
        return null;
      }

      // Explicitly construct the return object to avoid type inference issues
      const result: BasicTenantRow = {
        id: String(data.id),
        name: String(data.name),
        slug: String(data.slug),
        type: String(data.type),
        status: String(data.status),
        subscription_plan: String(data.subscription_plan)
      };

      return result;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  static async fetchDefaultTenantFromDb(): Promise<BasicTenantRow | null> {
    try {
      // First try to get default tenant
      const { data: defaultData, error: defaultError } = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('is_default', true)
        .eq('status', 'active')
        .maybeSingle();
        
      if (!defaultError && defaultData) {
        const result: BasicTenantRow = {
          id: String(defaultData.id),
          name: String(defaultData.name),
          slug: String(defaultData.slug),
          type: String(defaultData.type),
          status: String(defaultData.status),
          subscription_plan: String(defaultData.subscription_plan)
        };
        return result;
      }

      console.log('Default tenant not found, trying first active tenant');
      
      // Fallback to first active tenant
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('status', 'active')
        .maybeSingle();
        
      if (fallbackError || !fallbackData) {
        console.error('No active tenants found');
        return null;
      }
      
      const result: BasicTenantRow = {
        id: String(fallbackData.id),
        name: String(fallbackData.name),
        slug: String(fallbackData.slug),
        type: String(fallbackData.type),
        status: String(fallbackData.status),
        subscription_plan: String(fallbackData.subscription_plan)
      };
      
      return result;
    } catch (error) {
      console.error('Error fetching default tenant:', error);
      return null;
    }
  }
}
