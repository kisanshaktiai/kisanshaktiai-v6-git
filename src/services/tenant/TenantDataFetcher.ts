

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

  static async fetchTenantByIdFromDb(tenantId: string): Promise<BasicTenantRow | null> {
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

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      type: data.type,
      status: data.status,
      subscription_plan: data.subscription_plan
    };
  }

  static async fetchDefaultTenantFromDb(): Promise<BasicTenantRow | null> {
    // First try to get default tenant
    const { data: defaultData, error: defaultError } = await supabase
      .from('tenants')
      .select('id, name, slug, type, status, subscription_plan')
      .eq('is_default', true)
      .eq('status', 'active')
      .limit(1);
      
    if (!defaultError && defaultData && defaultData.length > 0) {
      const tenant = defaultData[0];
      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        status: tenant.status,
        subscription_plan: tenant.subscription_plan
      };
    }

    console.log('Default tenant not found, trying first active tenant');
    
    // Fallback to first active tenant
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('tenants')
      .select('id, name, slug, type, status, subscription_plan')
      .eq('status', 'active')
      .limit(1);
      
    if (fallbackError || !fallbackData || fallbackData.length === 0) {
      console.error('No active tenants found');
      return null;
    }
    
    const tenant = fallbackData[0];
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      type: tenant.type,
      status: tenant.status,
      subscription_plan: tenant.subscription_plan
    };
  }
}

