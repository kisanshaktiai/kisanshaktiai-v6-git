
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
          notification_preferences: typeof profileData.notification_preferences === 'string'
            ? JSON.parse(profileData.notification_preferences)
            : profileData.notification_preferences || {
                sms: true,
                push: true,
                email: false,
                whatsapp: true,
                calls: false
              },
          device_tokens: Array.isArray(profileData.device_tokens)
            ? profileData.device_tokens
            : JSON.parse(profileData.device_tokens || '[]'),
          expertise_areas: Array.isArray(profileData.expertise_areas)
            ? profileData.expertise_areas
            : [],
          metadata: typeof profileData.metadata === 'string'
            ? JSON.parse(profileData.metadata)
            : profileData.metadata || {}
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
        permissions: Array.isArray(ut.permissions)
          ? ut.permissions
          : JSON.parse(ut.permissions || '[]')
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

        currentTenant = tenant;
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
        currentTenant: tenant,
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
