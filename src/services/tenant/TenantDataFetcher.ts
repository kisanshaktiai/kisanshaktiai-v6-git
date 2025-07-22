
import { supabase } from '@/integrations/supabase/client';

export class TenantDataFetcher {
  static async fetchBrandingData(tenantId: string) {
    const { data } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    return data;
  }

  static async fetchFeaturesData(tenantId: string) {
    const { data } = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    return data;
  }

  static async fetchTenantByIdFromDb(tenantId: string) {
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

    return data;
  }

  static async fetchDefaultTenantFromDb() {
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
      
      return fallbackData;
    }

    return data;
  }
}
