
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

export const useTenantData = (tenantId?: string) => {
  const dispatch = useDispatch();
  const { currentTenant, tenantBranding, tenantFeatures, loading, error } = 
    useSelector((state: RootState) => state.tenant);

  useEffect(() => {
    if (!tenantId) return;

    const loadTenantData = async () => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // Load tenant basic info
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();

        if (tenantError) throw tenantError;

        dispatch(setCurrentTenant(tenant));

        // Load tenant branding
        const { data: branding, error: brandingError } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (brandingError && brandingError.code !== 'PGRST116') {
          console.warn('Branding not found:', brandingError);
        } else if (branding) {
          dispatch(setTenantBranding(branding));
        }

        // Load tenant features
        const { data: features, error: featuresError } = await supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (featuresError && featuresError.code !== 'PGRST116') {
          console.warn('Features not found:', featuresError);
        } else if (features) {
          dispatch(setTenantFeatures(features));
        }

      } catch (error) {
        console.error('Error loading tenant data:', error);
        dispatch(setError(error instanceof Error ? error.message : 'Failed to load tenant data'));
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
