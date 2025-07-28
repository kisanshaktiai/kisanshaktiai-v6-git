
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

// Emergency fallback tenant
const EMERGENCY_TENANT = {
  id: 'emergency-tenant',
  name: 'KisanShakti AI',
  slug: 'emergency',
  type: 'default',
  status: 'active',
  branding_version: 1,
  branding_updated_at: new Date().toISOString()
};

const EMERGENCY_BRANDING = {
  app_name: 'KisanShakti AI',
  app_tagline: 'Your smart farming journey starts here',
  primary_color: '#8BC34A',
  secondary_color: '#4CAF50',
  background_color: '#FFFFFF',
  accent_color: '#FF9800',
  text_color: '#1F2937',
  logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  version: 1
};

// Configuration
const LOADING_TIMEOUT = 8000; // 8 seconds max loading time
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 second

export const useTenantData = (tenantId?: string) => {
  const dispatch = useDispatch();
  const { currentTenant, tenantBranding, tenantFeatures, loading, error } = 
    useSelector((state: RootState) => state.tenant);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isComponentMounted = true;

    const setEmergencyFallback = () => {
      if (!isComponentMounted) return;
      
      console.warn('🚨 Using emergency tenant fallback');
      dispatch(setCurrentTenant(EMERGENCY_TENANT));
      dispatch(setTenantBranding(EMERGENCY_BRANDING));
      dispatch(setLoading(false));
    };

    const loadTenantDataWithTimeout = async () => {
      if (!isComponentMounted) return;

      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // Set up loading timeout
        timeoutId = setTimeout(() => {
          if (isComponentMounted) {
            console.warn('⏰ Tenant loading timeout, using emergency fallback');
            setEmergencyFallback();
          }
        }, LOADING_TIMEOUT);

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
          // For development/fallback: Skip complex detection and use emergency tenant immediately
          const hostname = window.location.hostname;
          const isDev = hostname === 'localhost' || 
                       hostname.includes('lovable') || 
                       hostname.includes('127.0.0.1') ||
                       hostname.includes('.local');

          if (isDev) {
            console.log('🔧 Development environment detected, using emergency tenant');
            if (!isComponentMounted) return;
            setEmergencyFallback();
            return;
          }

          // Try optimized tenant detection with retries
          let detectedTenant = null;
          let lastError = null;

          for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
            try {
              if (!isComponentMounted) return;
              
              const tenantService = TenantDetectionService.getInstance();
              detectedTenant = await Promise.race([
                tenantService.detectTenant(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Tenant detection timeout')), 3000)
                )
              ]);
              
              if (detectedTenant) break;
            } catch (error) {
              lastError = error;
              console.warn(`Tenant detection attempt ${attempt + 1} failed:`, error);
              
              if (attempt < RETRY_ATTEMPTS - 1) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              }
            }
          }
          
          if (!detectedTenant) {
            console.warn('All tenant detection attempts failed, using emergency fallback');
            if (!isComponentMounted) return;
            setEmergencyFallback();
            return;
          }
          
          // If we got tenant from cache with full branding data, use it directly
          if (detectedTenant.branding && detectedTenant.branding_version) {
            if (!isComponentMounted) return;
            dispatch(setCurrentTenant(detectedTenant));
            dispatch(setTenantBranding(detectedTenant.branding));
            clearTimeout(timeoutId);
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

        if (!isComponentMounted) return;
        dispatch(setCurrentTenant(tenant));

        // Load branding and features with version information (with timeout)
        const brandingPromise = Promise.race([
          supabase
            .from('tenant_branding')
            .select('logo_url, app_name, app_tagline, primary_color, secondary_color, background_color, accent_color, text_color, font_family, version')
            .eq('tenant_id', tenant.id)
            .maybeSingle(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Branding query timeout')), 2000)
          )
        ]);

        const featuresPromise = Promise.race([
          supabase
            .from('tenant_features')
            .select('*')
            .eq('tenant_id', tenant.id)
            .maybeSingle(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Features query timeout')), 2000)
          )
        ]);

        // Execute queries in parallel with timeout handling
        const [brandingResult, featuresResult] = await Promise.allSettled([brandingPromise, featuresPromise]);
        
        if (!isComponentMounted) return;

        // Handle branding result with fallback to emergency branding
        if (brandingResult.status === 'fulfilled') {
          const brandingResponse = brandingResult.value as any;
          if (brandingResponse?.data) {
            const brandingData = brandingResponse.data;
            dispatch(setTenantBranding(brandingData));
            
            // Update cache with fresh branding version if available
            if (brandingData.version && tenant.branding_version) {
              try {
                const tenantService = TenantDetectionService.getInstance();
                await tenantService.preloadTenant(window.location.hostname);
              } catch (cacheError) {
                console.warn('Cache update failed:', cacheError);
              }
            }
          } else {
            console.warn('No branding data found, using emergency branding');
            dispatch(setTenantBranding(EMERGENCY_BRANDING));
          }
        } else {
          console.warn('Branding query failed, using emergency branding:', brandingResult.status === 'rejected' ? brandingResult.reason : 'Unknown error');
          dispatch(setTenantBranding(EMERGENCY_BRANDING));
        }

        // Handle features result
        if (featuresResult.status === 'fulfilled') {
          const featuresResponse = featuresResult.value as any;
          if (featuresResponse?.data) {
            dispatch(setTenantFeatures(featuresResponse.data));
          }
        } else {
          console.warn('Features query failed:', featuresResult.status === 'rejected' ? featuresResult.reason : 'Unknown error');
          // Continue without features - they're optional
        }

      } catch (error) {
        console.error('Error loading tenant data:', error);
        
        if (!isComponentMounted) return;
        
        dispatch(setError(error instanceof Error ? error.message : 'Failed to load tenant data'));
        
        // Use emergency fallback on any error
        setEmergencyFallback();
      } finally {
        clearTimeout(timeoutId);
        if (isComponentMounted) {
          dispatch(setLoading(false));
        }
      }
    };

    // Validate cache version before loading if we have current tenant
    const validateAndLoad = async () => {
      if (!isComponentMounted) return;

      if (currentTenant && !tenantId) {
        try {
          const tenantService = TenantDetectionService.getInstance();
          const isValid = await tenantService.validateCacheVersion();
          
          if (!isValid) {
            console.log('Cache version invalid, refreshing tenant data');
            await loadTenantDataWithTimeout();
            return;
          }
        } catch (error) {
          console.warn('Cache validation failed:', error);
          // Continue to load tenant data
        }
      }
      
      // Only load if we don't have tenant data or if tenantId changed
      if (!currentTenant || (tenantId && currentTenant.id !== tenantId)) {
        await loadTenantDataWithTimeout();
      } else if (currentTenant && !loading) {
        // We have tenant data, ensure loading is false
        dispatch(setLoading(false));
      }
    };

    validateAndLoad();

    // Cleanup function
    return () => {
      isComponentMounted = false;
      clearTimeout(timeoutId);
    };
  }, [tenantId, dispatch, currentTenant?.id, loading]);

  // Add method to force refresh tenant data
  const refreshTenant = async () => {
    try {
      dispatch(setLoading(true));
      const tenantService = TenantDetectionService.getInstance();
      const refreshedTenant = await tenantService.forceRefreshTenant();
      
      if (refreshedTenant) {
        dispatch(setCurrentTenant(refreshedTenant));
        if (refreshedTenant.branding) {
          dispatch(setTenantBranding(refreshedTenant.branding));
        }
      } else {
        // Fallback to emergency tenant
        dispatch(setCurrentTenant(EMERGENCY_TENANT));
        dispatch(setTenantBranding(EMERGENCY_BRANDING));
      }
    } catch (error) {
      console.error('Error refreshing tenant:', error);
      dispatch(setCurrentTenant(EMERGENCY_TENANT));
      dispatch(setTenantBranding(EMERGENCY_BRANDING));
    } finally {
      dispatch(setLoading(false));
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
