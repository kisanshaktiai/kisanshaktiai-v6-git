
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
      const response = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('id', tenantId)
        .eq('status', 'active')
        .maybeSingle();

      if (response.error || !response.data) {
        console.error('Tenant not found:', response.error);
        return null;
      }

      // Use simple object destructuring to avoid type inference issues
      const { id, name, slug, type, status, subscription_plan } = response.data;
      
      return {
        id: String(id),
        name: String(name),
        slug: String(slug),
        type: String(type),
        status: String(status),
        subscription_plan: String(subscription_plan)
      };
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  static async fetchDefaultTenantFromDb(): Promise<BasicTenantRow | null> {
    try {
      // First try to get default tenant
      const defaultResponse = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('is_default', true)
        .eq('status', 'active')
        .maybeSingle();
        
      if (!defaultResponse.error && defaultResponse.data) {
        // Extract properties individually to avoid complex type inference
        const tenantData = defaultResponse.data;
        const result: BasicTenantRow = {
          id: String(tenantData.id),
          name: String(tenantData.name),
          slug: String(tenantData.slug),
          type: String(tenantData.type),
          status: String(tenantData.status),
          subscription_plan: String(tenantData.subscription_plan)
        };
        return result;
      }

      console.log('Default tenant not found, trying first active tenant');
      
      // Fallback to first active tenant
      const fallbackResponse = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, subscription_plan')
        .eq('status', 'active')
        .maybeSingle();
        
      if (fallbackResponse.error || !fallbackResponse.data) {
        console.error('No active tenants found');
        return null;
      }
      
      // Extract properties individually to avoid complex type inference
      const fallbackData = fallbackResponse.data;
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
