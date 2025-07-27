
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Tenant, TenantBranding, TenantFeatures, UserProfile, UserTenant } from '@/types/tenant';

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

      // Load user profile with error handling
      let profile: UserProfile | null = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile fetch error:', profileError);
          // Don't throw, continue with null profile
        } else if (profileData) {
          profile = {
            ...profileData,
            mobile_number: profileData.mobile_number || '',
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
      } catch (error) {
        console.warn('Failed to load user profile:', error);
        // Continue with null profile
      }

      // Create a default tenant if no tenant system is needed
      const defaultTenant: Tenant = {
        id: 'default',
        name: 'KisanShakti AI',
        slug: 'default',
        type: 'agri_company',
        status: 'active',
        subscription_plan: 'starter',
        subscription_start_date: new Date().toISOString(),
        max_farmers: 1000,
        max_dealers: 100,
        max_products: 500,
        max_storage_gb: 10,
        max_api_calls_per_day: 10000,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const defaultUserTenant: UserTenant = {
        id: 'default-user-tenant',
        user_id: user.id,
        tenant_id: 'default',
        role: 'farmer',
        is_active: true,
        is_primary: true,
        permissions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Set default branding and features
      const defaultBranding: TenantBranding = {
        id: 'default-branding',
        tenant_id: 'default',
        app_name: 'KisanShakti AI',
        logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
        primary_color: '#10b981',
        secondary_color: '#059669',
        accent_color: '#34d399',
        background_color: '#ffffff',
        text_color: '#111827',
        font_family: 'Inter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const defaultFeatures: TenantFeatures = {
        id: 'default-features',
        tenant_id: 'default',
        ai_chat: true,
        weather_forecast: true,
        marketplace: true,
        community_forum: true,
        satellite_imagery: true,
        soil_testing: true,
        drone_monitoring: false,
        iot_integration: false,
        ecommerce: true,
        payment_gateway: false,
        inventory_management: true,
        logistics_tracking: false,
        basic_analytics: true,
        advanced_analytics: false,
        predictive_analytics: false,
        custom_reports: false,
        api_access: false,
        webhook_support: false,
        third_party_integrations: false,
        white_label_mobile_app: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setState({
        user,
        profile,
        currentTenant: defaultTenant,
        userTenants: [defaultUserTenant],
        tenantBranding: defaultBranding,
        tenantFeatures: defaultFeatures,
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
    // For now, just use default tenant
    localStorage.setItem('currentTenantId', tenantId);
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
