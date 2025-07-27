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
          // Load specific tenant by ID with optimized query
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, slug, type, status')
            .eq('id', tenantId)
            .single();

          if (tenantError) throw tenantError;
          tenant = tenantData;
        } else {
          // Use optimized tenant detection service
          const tenantService = TenantDetectionService.getInstance();
          const detectedTenant = await tenantService.detectTenant();
          
          if (!detectedTenant) {
            throw new Error('No tenant configuration found');
          }
          
          // If we got tenant from cache, we might already have full data
          if (detectedTenant.branding) {
            dispatch(setCurrentTenant(detectedTenant));
            dispatch(setTenantBranding(detectedTenant.branding));
            dispatch(setLoading(false));
            return;
          }
          
          // Otherwise, get basic tenant data from database
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, slug, type, status')
            .eq('id', detectedTenant.id)
            .single();

          if (tenantError) throw tenantError;
          tenant = tenantData;
        }

        dispatch(setCurrentTenant(tenant));

        // Load branding and features in parallel for better performance
        const brandingPromise = supabase
          .from('tenant_branding')
          .select('logo_url, app_name, app_tagline, primary_color, secondary_color, background_color, accent_color, text_color, font_family, neutral_color, muted_color, gray_50, gray_100, gray_200, gray_300, gray_400, gray_500, gray_600, gray_700, gray_800, gray_900')
          .eq('tenant_id', tenant.id)
          .maybeSingle(); // Use maybeSingle instead of single to handle missing records

        const featuresPromise = supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        // Execute queries in parallel
        const [brandingResult, featuresResult] = await Promise.allSettled([brandingPromise, featuresPromise]);
        
        // Handle branding result
        if (brandingResult.status === 'fulfilled' && brandingResult.value.data) {
          dispatch(setTenantBranding(brandingResult.value.data));
        } else if (brandingResult.status === 'rejected') {
          console.warn('Branding query failed:', brandingResult.reason);
        }

        // Handle features result
        if (featuresResult.status === 'fulfilled' && featuresResult.value.data) {
          dispatch(setTenantFeatures(featuresResult.value.data));
        } else if (featuresResult.status === 'rejected') {
          console.warn('Features query failed:', featuresResult.reason);
        }

      } catch (error) {
        console.error('Error loading tenant data:', error);
        dispatch(setError(error instanceof Error ? error.message : 'Failed to load tenant data'));
        
        // Try to use emergency fallback
        const tenantService = TenantDetectionService.getInstance();
        const emergencyTenant = tenantService['createEmergencyTenant']?.();
        if (emergencyTenant) {
          dispatch(setCurrentTenant(emergencyTenant));
          if (emergencyTenant.branding) {
            dispatch(setTenantBranding(emergencyTenant.branding));
          }
        }
      } finally {
        dispatch(setLoading(false));
      }
    };

    // Only load if we don't have tenant data or if tenantId changed
    if (!currentTenant || (tenantId && currentTenant.id !== tenantId)) {
      loadTenantData();
    } else if (currentTenant && !loading) {
      // We have tenant data, ensure loading is false
      dispatch(setLoading(false));
    }
  }, [tenantId, dispatch, currentTenant?.id, loading]);

  return {
    currentTenant,
    tenantBranding,
    tenantFeatures,
    loading,
    error
  };
};
