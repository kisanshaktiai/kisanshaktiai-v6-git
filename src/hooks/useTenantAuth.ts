
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Tenant, TenantBranding, TenantFeatures, UserProfile, UserTenant, SubscriptionPlan } from '@/types/tenant';

interface TenantAuthState {
  user: User | null;
  profile: UserProfile | null;
  currentTenant: Tenant | null;
  userTenants: UserTenant[];
  tenantBranding: TenantBranding | null;
  tenantFeatures: TenantFeatures | null;
  loading: boolean;
  error: string | null;
}

// Helper function to safely parse JSON
const safeJsonParse = (value: any, fallback: any = null) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

// Helper function to convert database subscription plan to our type
const convertSubscriptionPlan = (plan: string | null | undefined): SubscriptionPlan => {
  if (!plan) return 'kisan';
  
  switch (plan) {
    case 'starter':
      return 'kisan';
    case 'growth':
      return 'shakti';
    case 'enterprise':
      return 'ai';
    case 'kisan':
    case 'shakti':
    case 'ai':
      return plan as SubscriptionPlan;
    default:
      return 'kisan';
  }
};

// Helper function to convert database tenant to our Tenant type
const convertDatabaseTenant = (dbTenant: any): Tenant => {
  return {
    id: dbTenant.id,
    slug: dbTenant.slug,
    name: dbTenant.name,
    type: dbTenant.type,
    status: dbTenant.status,
    owner_name: dbTenant.owner_name,
    owner_email: dbTenant.owner_email,
    owner_phone: dbTenant.owner_phone,
    business_registration: dbTenant.business_registration,
    business_address: safeJsonParse(dbTenant.business_address, null),
    established_date: dbTenant.established_date,
    subscription_plan: convertSubscriptionPlan(dbTenant.subscription_plan),
    subscription_start_date: dbTenant.subscription_start_date,
    subscription_end_date: dbTenant.subscription_end_date,
    trial_ends_at: dbTenant.trial_ends_at,
    max_farmers: dbTenant.max_farmers || 1000,
    max_dealers: dbTenant.max_dealers || 50,
    max_products: dbTenant.max_products || 100,
    max_storage_gb: dbTenant.max_storage_gb || 10,
    max_api_calls_per_day: dbTenant.max_api_calls_per_day || 10000,
    subdomain: dbTenant.subdomain,
    custom_domain: dbTenant.custom_domain,
    metadata: safeJsonParse(dbTenant.metadata, {}),
    created_at: dbTenant.created_at,
    updated_at: dbTenant.updated_at,
    deleted_at: dbTenant.deleted_at,
  };
};

export const useTenantAuth = () => {
  const [state, setState] = useState<TenantAuthState>({
    user: null,
    profile: null,
    currentTenant: null,
    userTenants: [],
    tenantBranding: null,
    tenantFeatures: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setState({
            user: null,
            profile: null,
            currentTenant: null,
            userTenants: [],
            tenantBranding: null,
            tenantFeatures: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (user: User) => {
    try {
      setState(prev => ({ ...prev, user, loading: true, error: null }));

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      let profile: UserProfile | null = null;
      if (profileData) {
        profile = {
          ...profileData,
          notification_preferences: safeJsonParse(profileData.notification_preferences, {
            sms: true,
            push: true,
            email: false,
            whatsapp: true,
            calls: false
          }),
          device_tokens: safeJsonParse(profileData.device_tokens, []),
          expertise_areas: Array.isArray(profileData.expertise_areas)
            ? profileData.expertise_areas
            : [],
          metadata: safeJsonParse(profileData.metadata, {})
        };
      }

      // Load user tenant associations
      const { data: userTenantsData, error: tenantsError } = await supabase
        .from('user_tenants')
        .select(`
          *,
          tenant:tenant_id (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tenantsError) throw tenantsError;

      const userTenants: UserTenant[] = userTenantsData?.map(ut => ({
        ...ut,
        permissions: safeJsonParse(ut.permissions, [])
      })) || [];

      // Get current tenant (primary or first available)
      const savedTenantId = localStorage.getItem('currentTenantId');
      let currentTenantAssoc = userTenants?.find(ut => ut.tenant_id === savedTenantId) || userTenants?.[0];
      
      let currentTenant: Tenant | null = null;
      let tenantBranding: TenantBranding | null = null;
      let tenantFeatures: TenantFeatures | null = null;

      if (currentTenantAssoc) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', currentTenantAssoc.tenant_id)
          .single();

        const { data: branding } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', currentTenantAssoc.tenant_id)
          .single();

        const { data: features } = await supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', currentTenantAssoc.tenant_id)
          .single();

        currentTenant = tenant ? convertDatabaseTenant(tenant) : null;
        tenantBranding = branding;
        tenantFeatures = features;
      }

      setState({
        user,
        profile,
        currentTenant,
        userTenants,
        tenantBranding,
        tenantFeatures,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error loading user data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load user data'
      }));
    }
  };

  const switchTenant = async (tenantId: string) => {
    const tenantAssoc = state.userTenants.find(ut => ut.tenant_id === tenantId);
    if (!tenantAssoc) return;

    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      const { data: features } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      setState(prev => ({
        ...prev,
        currentTenant: tenant ? convertDatabaseTenant(tenant) : null,
        tenantBranding: branding,
        tenantFeatures: features,
      }));

      localStorage.setItem('currentTenantId', tenantId);
    } catch (error) {
      console.error('Error switching tenant:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentTenantId');
  };

  return {
    ...state,
    switchTenant,
    signOut,
    refetch: () => state.user && loadUserData(state.user),
  };
};
