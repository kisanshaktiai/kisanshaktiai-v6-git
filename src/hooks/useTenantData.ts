
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
          // Load specific tenant by ID with versioning support
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, slug, type, status, branding_version, branding_updated_at')
            .eq('id', tenantId)
            .single();

          if (tenantError) throw tenantError;
          tenant = tenantData;
        } else {
          // Use optimized tenant detection service with versioning
          const tenantService = TenantDetectionService.getInstance();
          const detectedTenant = await tenantService.detectTenant();
          
          if (!detectedTenant) {
            throw new Error('No tenant configuration found');
          }
          
          // If we got tenant from cache with full branding data, use it directly
          if (detectedTenant.branding && detectedTenant.branding_version) {
            dispatch(setCurrentTenant(detectedTenant));
            dispatch(setTenantBranding(detectedTenant.branding));
            dispatch(setLoading(false));
            return;
          }
          
          // Otherwise, get tenant data from database with versioning
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, slug, type, status, branding_version, branding_updated_at')
            .eq('id', detectedTenant.id)
            .single();

          if (tenantError) throw tenantError;
          tenant = tenantData;
        }

        dispatch(setCurrentTenant(tenant));

        // Load branding and features with version information
        const brandingPromise = supabase
          .from('tenant_branding')
          .select('logo_url, app_name, app_tagline, primary_color, secondary_color, background_color, accent_color, text_color, font_family, version')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        const featuresPromise = supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        // Execute queries in parallel
        const [brandingResult, featuresResult] = await Promise.allSettled([brandingPromise, featuresPromise]);
        
        // Handle branding result with version tracking
        if (brandingResult.status === 'fulfilled' && brandingResult.value.data) {
          const brandingData = brandingResult.value.data;
          dispatch(setTenantBranding(brandingData));
          
          // Update cache with fresh branding version if available
          if (brandingData.version && tenant.branding_version) {
            const tenantService = TenantDetectionService.getInstance();
            // This will update the cache with the latest version information
            await tenantService.preloadTenant(window.location.hostname);
          }
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
        
        // Try to use emergency fallback with version support
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

    // Validate cache version before loading if we have current tenant
    const validateAndLoad = async () => {
      if (currentTenant && !tenantId) {
        const tenantService = TenantDetectionService.getInstance();
        const isValid = await tenantService.validateCacheVersion();
        
        if (!isValid) {
          console.log('Cache version invalid, refreshing tenant data');
          await loadTenantData();
          return;
        }
      }
      
      // Only load if we don't have tenant data or if tenantId changed
      if (!currentTenant || (tenantId && currentTenant.id !== tenantId)) {
        await loadTenantData();
      } else if (currentTenant && !loading) {
        // We have tenant data, ensure loading is false
        dispatch(setLoading(false));
      }
    };

    validateAndLoad();
  }, [tenantId, dispatch, currentTenant?.id, loading]);

  // Add method to force refresh tenant data
  const refreshTenant = async () => {
    const tenantService = TenantDetectionService.getInstance();
    const refreshedTenant = await tenantService.forceRefreshTenant();
    
    if (refreshedTenant) {
      dispatch(setCurrentTenant(refreshedTenant));
      if (refreshedTenant.branding) {
        dispatch(setTenantBranding(refreshedTenant.branding));
      }
    }
  };

  return {
    currentTenant,
    tenantBranding,
    tenantFeatures,
    loading,
    error,
    refreshTenant
  };
};
