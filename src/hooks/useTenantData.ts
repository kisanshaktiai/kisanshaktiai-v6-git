
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/integrations/supabase/client';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { setCurrentTenant } from '@/store/slices/authSlice';
import { useUnifiedTenantData } from './useUnifiedTenantData';

// Emergency fallback tenant
const EMERGENCY_TENANT_ID = 'emergency-tenant';

// Configuration
const LOADING_TIMEOUT = 8000; // 8 seconds max loading time
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 second

export const useTenantData = (tenantId?: string) => {
  const dispatch = useDispatch();
  const { currentTenant } = useSelector((state: RootState) => state.auth);

  // Use React Query for tenant data
  const { 
    tenant, 
    branding, 
    features, 
    isLoading: loading, 
    error 
  } = useUnifiedTenantData(currentTenant || tenantId);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isComponentMounted = true;

    const setEmergencyFallback = () => {
      if (!isComponentMounted) return;
      
      console.warn('🚨 Using emergency tenant fallback');
      dispatch(setCurrentTenant(EMERGENCY_TENANT_ID));
    };

    const loadTenantDataWithTimeout = async () => {
      if (!isComponentMounted) return;

      try {
        // Set up loading timeout
        timeoutId = setTimeout(() => {
          if (isComponentMounted) {
            console.warn('⏰ Tenant loading timeout, using emergency fallback');
            setEmergencyFallback();
          }
        }, LOADING_TIMEOUT);

        if (tenantId) {
          // Load specific tenant by ID
          dispatch(setCurrentTenant(tenantId));
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
          
          if (!isComponentMounted) return;
          dispatch(setCurrentTenant(detectedTenant.id));
        }

      } catch (error) {
        console.error('Error loading tenant data:', error);
        
        if (!isComponentMounted) return;
        
        // Use emergency fallback on any error
        setEmergencyFallback();
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Only load if we don't have tenant data or if tenantId changed
    if (!currentTenant || (tenantId && currentTenant !== tenantId)) {
      loadTenantDataWithTimeout();
    }

    // Cleanup function
    return () => {
      isComponentMounted = false;
      clearTimeout(timeoutId);
    };
  }, [tenantId, dispatch, currentTenant]);

  // Add method to force refresh tenant data
  const refreshTenant = async () => {
    try {
      const tenantService = TenantDetectionService.getInstance();
      const refreshedTenant = await tenantService.forceRefreshTenant();
      
      if (refreshedTenant) {
        dispatch(setCurrentTenant(refreshedTenant.id));
      } else {
        // Fallback to emergency tenant
        dispatch(setCurrentTenant(EMERGENCY_TENANT_ID));
      }
    } catch (error) {
      console.error('Error refreshing tenant:', error);
      dispatch(setCurrentTenant(EMERGENCY_TENANT_ID));
    }
  };

  return {
    currentTenant: tenant,
    tenantBranding: branding,
    tenantFeatures: features,
    loading,
    error,
    refreshTenant
  };
};
