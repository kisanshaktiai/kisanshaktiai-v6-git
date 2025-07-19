
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/integrations/supabase/client';
import { 
  setCurrentTenant, 
  setTenantBranding, 
  setTenantFeatures, 
  setLoading, 
  setError 
} from '@/store/slices/tenantSlice';
import { DEFAULT_TENANT_ID } from '@/config/constants';

export const useTenantData = (tenantId?: string) => {
  const dispatch = useDispatch();
  const { currentTenant, tenantBranding, tenantFeatures, loading, error } = 
    useSelector((state: RootState) => state.tenant);

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // Use provided tenantId or fallback to default
        const targetTenantId = tenantId || DEFAULT_TENANT_ID;

        console.log('Loading tenant data for:', targetTenantId);

        // Load tenant basic info with error handling
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', targetTenantId)
          .maybeSingle();

        if (tenantError) {
          console.error('Tenant query error:', tenantError);
          throw tenantError;
        }

        if (!tenant) {
          console.log('No tenant found, creating default tenant data');
          // Provide fallback tenant data
          const defaultTenant = {
            id: DEFAULT_TENANT_ID,
            name: 'KisanShakti AI',
            slug: 'default',
            type: 'default',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          dispatch(setCurrentTenant(defaultTenant));
        } else {
          dispatch(setCurrentTenant(tenant));
        }

        // Load tenant branding with error handling
        try {
          const { data: branding, error: brandingError } = await supabase
            .from('tenant_branding')
            .select('*')
            .eq('tenant_id', targetTenantId)
            .maybeSingle();

          if (brandingError && brandingError.code !== 'PGRST116') {
            console.warn('Branding query error (non-critical):', brandingError);
          } else if (branding) {
            dispatch(setTenantBranding(branding));
          } else {
            // Set default branding
            const defaultBranding = {
              tenant_id: targetTenantId,
              app_name: 'KisanShakti AI',
              app_tagline: 'Your Smart Farming Assistant',
              logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
              primary_color: '#8BC34A',
              secondary_color: '#4CAF50',
              accent_color: '#689F38',
              background_color: '#FFFFFF'
            };
            dispatch(setTenantBranding(defaultBranding));
          }
        } catch (brandingErr) {
          console.warn('Non-critical branding load error:', brandingErr);
        }

        // Load tenant features with error handling
        try {
          const { data: features, error: featuresError } = await supabase
            .from('tenant_features')
            .select('*')
            .eq('tenant_id', targetTenantId)
            .maybeSingle();

          if (featuresError && featuresError.code !== 'PGRST116') {
            console.warn('Features query error (non-critical):', featuresError);
          } else if (features) {
            dispatch(setTenantFeatures(features));
          } else {
            // Set default features
            const defaultFeatures = {
              tenant_id: targetTenantId,
              ai_chat: true,
              weather_forecast: true,
              marketplace: true,
              basic_analytics: true,
              community_forum: true
            };
            dispatch(setTenantFeatures(defaultFeatures));
          }
        } catch (featuresErr) {
          console.warn('Non-critical features load error:', featuresErr);
        }

        console.log('Tenant data loaded successfully');

      } catch (error) {
        console.error('Critical error loading tenant data:', error);
        dispatch(setError(error instanceof Error ? error.message : 'Failed to load tenant data'));
        
        // Still set some default data to prevent complete failure
        const fallbackTenant = {
          id: DEFAULT_TENANT_ID,
          name: 'KisanShakti AI',
          slug: 'default',
          type: 'default',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        dispatch(setCurrentTenant(fallbackTenant));
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadTenantData();
  }, [tenantId, dispatch]);

  return {
    currentTenant,
    tenantBranding,
    tenantFeatures,
    loading,
    error
  };
};
