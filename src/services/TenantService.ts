
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config/constants';

export class TenantService {
  private static instance: TenantService;
  private currentTenantId: string = DEFAULT_TENANT_ID;

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  getCurrentTenantId(): string {
    return this.currentTenantId;
  }

  setCurrentTenantId(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  async getTenantData() {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', this.currentTenantId)
        .single();

      if (tenantError) throw tenantError;

      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', this.currentTenantId)
        .single();

      const { data: features } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', this.currentTenantId)
        .single();

      return {
        tenant,
        branding,
        features
      };
    } catch (error) {
      console.error('Error loading tenant data:', error);
      throw error;
    }
  }

  async getUserTenants(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_tenants')
        .select(`
          *,
          tenant:tenant_id (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading user tenants:', error);
      return [];
    }
  }

  async createUserTenantAssociation(userId: string, role: string = 'farmer') {
    try {
      const { data, error } = await supabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: this.currentTenantId,
          role,
          is_primary: true,
          is_active: true,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user tenant association:', error);
      throw error;
    }
  }
}

export const tenantService = TenantService.getInstance();
