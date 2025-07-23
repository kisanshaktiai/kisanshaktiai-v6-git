import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPlan, getSubscriptionPlanLimits } from '@/types/tenant';

export class TenantService {
  private static instance: TenantService;
  private currentTenantId: string = 'fallback-tenant-id';

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

      // If we don't have a valid tenant ID, try to get the default tenant
      if (this.currentTenantId === 'fallback-tenant-id') {
        try {
          const { data: defaultTenant, error } = await supabase.functions.invoke('tenant-default', {
            method: 'GET'
          });

          if (!error && defaultTenant?.id) {
            this.currentTenantId = defaultTenant.id;
            console.log('TenantService: Updated tenant ID to:', this.currentTenantId);
          }
        } catch (tenantError) {
          console.warn('TenantService: Could not get default tenant, using fallback');
        }
      }

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
        subscription_plan: 'kisan' as SubscriptionPlan,
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

  // New method to create tenant with validation using the database function
  async createTenantWithValidation(tenantData: {
    name: string;
    slug: string;
    type: string;
    status?: string;
    subscription_plan?: SubscriptionPlan;
    owner_name?: string;
    owner_email?: string;
    owner_phone?: string;
    business_registration?: string;
    business_address?: any;
    established_date?: string;
    subscription_start_date?: string;
    subscription_end_date?: string;
    trial_ends_at?: string;
    max_farmers?: number;
    max_dealers?: number;
    max_products?: number;
    max_storage_gb?: number;
    max_api_calls_per_day?: number;
    subdomain?: string;
    custom_domain?: string;
    metadata?: any;
  }) {
    try {
      const { data, error } = await supabase.rpc('create_tenant_with_validation', {
        p_name: tenantData.name,
        p_slug: tenantData.slug,
        p_type: tenantData.type,
        p_status: tenantData.status || 'trial',
        p_subscription_plan: tenantData.subscription_plan || 'kisan',
        p_owner_name: tenantData.owner_name,
        p_owner_email: tenantData.owner_email,
        p_owner_phone: tenantData.owner_phone,
        p_business_registration: tenantData.business_registration,
        p_business_address: tenantData.business_address,
        p_established_date: tenantData.established_date,
        p_subscription_start_date: tenantData.subscription_start_date,
        p_subscription_end_date: tenantData.subscription_end_date,
        p_trial_ends_at: tenantData.trial_ends_at,
        p_max_farmers: tenantData.max_farmers,
        p_max_dealers: tenantData.max_dealers,
        p_max_products: tenantData.max_products,
        p_max_storage_gb: tenantData.max_storage_gb,
        p_max_api_calls_per_day: tenantData.max_api_calls_per_day,
        p_subdomain: tenantData.subdomain,
        p_custom_domain: tenantData.custom_domain,
        p_metadata: tenantData.metadata || {}
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('TenantService: Error creating tenant:', error);
      throw error;
    }
  }
}

export const tenantService = TenantService.getInstance();
