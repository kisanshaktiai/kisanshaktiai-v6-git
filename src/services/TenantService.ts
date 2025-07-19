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
    console.log('Tenant ID set to:', tenantId);
  }

  async getTenantData() {
    try {
      console.log('TenantService: Getting tenant data for:', this.currentTenantId);

      // First, let's try a simple query to test if the database is accessible
      try {
        const { data: testQuery, error: testError } = await supabase
          .from('tenants')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error('TenantService: Database connectivity test failed:', testError);
          // Return default data if database is not accessible
          return this.getDefaultTenantData();
        }
        
        console.log('TenantService: Database connectivity confirmed');
      } catch (connectError) {
        console.error('TenantService: Database connection error:', connectError);
        return this.getDefaultTenantData();
      }

      // Load tenant with error handling
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', this.currentTenantId)
        .maybeSingle();

      if (tenantError) {
        console.error('TenantService: Tenant query error:', tenantError);
        return this.getDefaultTenantData();
      }

      if (!tenant) {
        console.log('TenantService: No tenant found, using default');
        return this.getDefaultTenantData();
      }

      // Load branding and features in parallel with error handling
      const [brandingResult, featuresResult] = await Promise.allSettled([
        supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', this.currentTenantId)
          .maybeSingle(),
        supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', this.currentTenantId)
          .maybeSingle()
      ]);

      const branding = brandingResult.status === 'fulfilled' && !brandingResult.value.error 
        ? brandingResult.value.data 
        : null;

      const features = featuresResult.status === 'fulfilled' && !featuresResult.value.error 
        ? featuresResult.value.data 
        : null;

      if (brandingResult.status === 'rejected') {
        console.warn('TenantService: Branding load failed (non-critical):', brandingResult.reason);
      }

      if (featuresResult.status === 'rejected') {
        console.warn('TenantService: Features load failed (non-critical):', featuresResult.reason);
      }

      console.log('TenantService: Tenant data loaded successfully');
      return {
        tenant,
        branding: branding || this.getDefaultBranding(),
        features: features || this.getDefaultFeatures()
      };
    } catch (error) {
      console.error('TenantService: Error loading tenant data:', error);
      return this.getDefaultTenantData();
    }
  }

  private getDefaultTenantData() {
    return {
      tenant: {
        id: this.currentTenantId,
        name: 'KisanShakti AI',
        slug: 'default',
        type: 'default',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      branding: this.getDefaultBranding(),
      features: this.getDefaultFeatures()
    };
  }

  private getDefaultBranding() {
    return {
      tenant_id: this.currentTenantId,
      app_name: 'KisanShakti AI',
      app_tagline: 'Your Smart Farming Assistant',
      logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      primary_color: '#8BC34A',
      secondary_color: '#4CAF50',
      accent_color: '#689F38',
      background_color: '#FFFFFF'
    };
  }

  private getDefaultFeatures() {
    return {
      tenant_id: this.currentTenantId,
      ai_chat: true,
      weather_forecast: true,
      marketplace: true,
      basic_analytics: true,
      community_forum: true
    };
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
      console.error('TenantService: Error loading user tenants:', error);
      return [];
    }
  }

  async createUserTenantAssociation(userId: string, role: 'farmer' | 'dealer' | 'super_admin' | 'tenant_owner' | 'tenant_admin' | 'tenant_manager' | 'agent' = 'farmer') {
    try {
      const { data, error } = await supabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: this.currentTenantId,
          role: role,
          is_primary: true,
          is_active: true,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('TenantService: Error creating user tenant association:', error);
      throw error;
    }
  }
}

export const tenantService = TenantService.getInstance();
