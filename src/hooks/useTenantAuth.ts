
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
  
  // Handle all possible database values
  const validPlans: SubscriptionPlan[] = ['kisan', 'shakti', 'ai', 'custom', 'Kisan_Basic', 'Shakti_Growth', 'AI_Enterprise'];
  
  if (validPlans.includes(plan as SubscriptionPlan)) {
    return plan as SubscriptionPlan;
  }
  
  // Legacy conversions
  switch (plan) {
    case 'starter':
      return 'kisan';
    case 'growth':
      return 'shakti';
    case 'enterprise':
      return 'ai';
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

// Helper function to convert database profile to UserProfile type
const convertDatabaseProfile = (dbProfile: any): UserProfile => {
  return {
    ...dbProfile,
    mobile_number: dbProfile.mobile_number,
    notification_preferences: safeJsonParse(dbProfile.notification_preferences, {
      sms: true,
      push: true,
      email: false,
      whatsapp: true,
      calls: false
    }),
    device_tokens: safeJsonParse(dbProfile.device_tokens, []),
    expertise_areas: Array.isArray(dbProfile.expertise_areas)
      ? dbProfile.expertise_areas
      : [],
    metadata: safeJsonParse(dbProfile.metadata, {}),
    mobile_number_verified: dbProfile.mobile_number_verified || false,
    email_verified: dbProfile.email_verified || false,
    last_seen: dbProfile.last_seen || null,
    timezone: dbProfile.timezone || null
  };
};

// Helper function to convert database features to TenantFeatures type
const convertDatabaseFeatures = (dbFeatures: any): TenantFeatures => {
  return {
    id: dbFeatures.id,
    tenant_id: dbFeatures.tenant_id,
    module_access: {
      weather: dbFeatures.weather_forecasting || false,
      satellite: dbFeatures.satellite_monitoring || false,
      marketplace: dbFeatures.marketplace_access || false,
      analytics: dbFeatures.basic_analytics || false,
      ai_chat: dbFeatures.ai_chat || false,
      community: dbFeatures.community_forum || false,
      financial: dbFeatures.financial_tracking || false,
      inventory: dbFeatures.inventory_management || false,
      pest_disease: dbFeatures.pest_disease_detection || false,
      soil_health: dbFeatures.soil_health_monitoring || false,
      supply_chain: dbFeatures.supply_chain_tracking || false,
      mobile_app: dbFeatures.mobile_app || false,
      offline_mode: dbFeatures.offline_mode || false,
      multi_language: dbFeatures.multi_language || false,
      sms_notifications: dbFeatures.sms_notifications || false,
      payment_integration: dbFeatures.payment_integration || false,
      api_access: dbFeatures.api_access || false,
      custom_reports: dbFeatures.custom_reports || false,
      advanced_analytics: dbFeatures.advanced_analytics || false,
      drone_monitoring: dbFeatures.drone_monitoring || false,
      premium_support: dbFeatures.premium_support || false,
      white_label_mobile_app: dbFeatures.white_label_mobile_app || false,
      weather_alerts: dbFeatures.weather_alerts || false,
      farmer_onboarding: dbFeatures.farmer_onboarding || false
    },
    feature_flags: {
      beta_features: false,
      experimental_ui: false,
      advanced_ai: dbFeatures.ai_chat || false,
      offline_sync: dbFeatures.offline_mode || false,
      multi_tenant: true,
      custom_branding: dbFeatures.white_label_mobile_app || false
    },
    limits: {
      max_farmers: 1000,
      max_dealers: 50,
      max_products: 100,
      max_storage_gb: 10,
      max_api_calls_per_day: 10000
    },
    // Include all database fields for backward compatibility
    advanced_analytics: dbFeatures.advanced_analytics,
    ai_chat: dbFeatures.ai_chat,
    api_access: dbFeatures.api_access,
    basic_analytics: dbFeatures.basic_analytics,
    community_forum: dbFeatures.community_forum,
    custom_reports: dbFeatures.custom_reports,
    drone_monitoring: dbFeatures.drone_monitoring,
    farmer_onboarding: dbFeatures.farmer_onboarding,
    financial_tracking: dbFeatures.financial_tracking,
    inventory_management: dbFeatures.inventory_management,
    marketplace_access: dbFeatures.marketplace_access,
    mobile_app: dbFeatures.mobile_app,
    multi_language: dbFeatures.multi_language,
    offline_mode: dbFeatures.offline_mode,
    payment_integration: dbFeatures.payment_integration,
    pest_disease_detection: dbFeatures.pest_disease_detection,
    premium_support: dbFeatures.premium_support,
    satellite_monitoring: dbFeatures.satellite_monitoring,
    sms_notifications: dbFeatures.sms_notifications,
    soil_health_monitoring: dbFeatures.soil_health_monitoring,
    supply_chain_tracking: dbFeatures.supply_chain_tracking,
    weather_alerts: dbFeatures.weather_alerts,
    weather_forecasting: dbFeatures.weather_forecasting,
    white_label_mobile_app: dbFeatures.white_label_mobile_app,
    created_at: dbFeatures.created_at,
    updated_at: dbFeatures.updated_at
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
        profile = convertDatabaseProfile(profileData);
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
        permissions: safeJsonParse(ut.permissions, []),
        tenant: ut.tenant ? convertDatabaseTenant(ut.tenant) : undefined
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
        tenantFeatures = features ? convertDatabaseFeatures(features) : null;
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
        tenantFeatures: features ? convertDatabaseFeatures(features) : null,
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
