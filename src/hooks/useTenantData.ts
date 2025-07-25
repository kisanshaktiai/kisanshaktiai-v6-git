
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/integrations/supabase/client';
import { TenantDetectionService } from '@/services/TenantDetectionService';
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
    const loadTenantData = async () => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        let tenant;
        
        if (tenantId) {
          // Load specific tenant by ID
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

          if (tenantError) throw tenantError;
          tenant = tenantData;
        } else {
          // Use tenant detection service
          const tenantService = TenantDetectionService.getInstance();
          const detectedTenant = await tenantService.detectTenant();
          
          if (!detectedTenant) {
            throw new Error('No tenant configuration found');
          }
          
          // Convert detected tenant to database format
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', detectedTenant.id)
            .single();

          if (tenantError) throw tenantError;
          tenant = tenantData;
        }

        dispatch(setCurrentTenant(tenant));

        // Load tenant branding with timeout
        const brandingPromise = supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', tenant.id)
          .single();

        const featuresPromise = supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', tenant.id)
          .single();

        // Load branding and features in parallel with timeout
        const results = await Promise.allSettled([brandingPromise, featuresPromise]);
        
        const [brandingResult, featuresResult] = results;

        if (brandingResult.status === 'fulfilled' && brandingResult.value.data) {
          dispatch(setTenantBranding(brandingResult.value.data));
        } else {
          console.warn('Branding not found or failed to load');
        }

        if (featuresResult.status === 'fulfilled' && featuresResult.value.data) {
          dispatch(setTenantFeatures(featuresResult.value.data));
        } else {
          console.warn('Features not found or failed to load');
        }

      } catch (error) {
        console.error('Error loading tenant data:', error);
        dispatch(setError(error instanceof Error ? error.message : 'Failed to load tenant data'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    // Only load if we don't have tenant data or if tenantId changed
    if (!currentTenant || (tenantId && currentTenant.id !== tenantId)) {
      loadTenantData();
    }
  }, [tenantId, dispatch, currentTenant?.id]);

  return {
    currentTenant,
    tenantBranding,
    tenantFeatures,
    loading,
    error
  };
};
