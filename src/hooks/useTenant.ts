
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentTenant, setTenantBranding, setTenantFeatures } from '../store/slices/tenantSlice';
import { supabase } from '../integrations/supabase/client';
import { secureStorage } from '../services/storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';
import { SubscriptionPlan } from '../types/tenant';

// Cache for tenant data to avoid repeated API calls
let cachedDefaultTenant: any = null;
let tenantCacheTimestamp = 0;
const TENANT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to convert database subscription plan to our type
const convertSubscriptionPlan = (plan: string | null | undefined): SubscriptionPlan => {
  if (!plan) return 'kisan';
  
  switch (plan) {
    case 'starter':
      return 'kisan';
    case 'growth':
      return 'shakti';
    case 'enterprise':
      return 'ai';
    case 'kisan':
    case 'shakti':
    case 'ai':
      return plan as SubscriptionPlan;
    default:
      return 'kisan';
  }
};

async function getDefaultTenant() {
  const now = Date.now();
  
  // Return cached tenant if still valid
  if (cachedDefaultTenant && (now - tenantCacheTimestamp) < TENANT_CACHE_DURATION) {
    console.log('useTenant: Using cached default tenant');
    return cachedDefaultTenant;
  }

  try {
    console.log('useTenant: Fetching default tenant from API');
    
    const { data, error } = await supabase.functions.invoke('tenant-default', {
      method: 'GET'
    });

    if (error) {
      console.error('useTenant: Error fetching default tenant:', error);
      // Return cached tenant as fallback if available
      if (cachedDefaultTenant) {
        console.log('useTenant: Using cached tenant as fallback');
        return cachedDefaultTenant;
      }
      throw error;
    }

    if (data) {
      console.log('useTenant: Default tenant fetched successfully:', data);
      cachedDefaultTenant = data;
      tenantCacheTimestamp = now;
      
      // Cache in storage for offline use
      try {
        await secureStorage.setItem('cached_default_tenant', JSON.stringify(data));
      } catch (storageError) {
        console.warn('useTenant: Failed to cache tenant in storage:', storageError);
      }
      
      return data;
    }

    throw new Error('No default tenant data received');
  } catch (error) {
    console.error('useTenant: Failed to fetch default tenant:', error);
    
    // Try to get cached tenant from storage as last resort
    try {
      const cached = await secureStorage.getItem('cached_default_tenant');
      if (cached) {
        const parsedCached = JSON.parse(cached);
        console.log('useTenant: Using stored cached tenant as fallback');
        cachedDefaultTenant = parsedCached;
        return parsedCached;
      }
    } catch (storageError) {
      console.error('useTenant: Failed to get cached tenant from storage:', storageError);
    }
    
    throw error;
  }
}

export const useTenant = () => {
  const dispatch = useDispatch();
  const { currentTenant, tenantBranding, tenantFeatures, loading } = useSelector(
    (state: RootState) => state.tenant
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenantData();
  }, []);

  const loadTenantData = async () => {
    try {
      setError(null);
      
      console.log('useTenant: Loading tenant data');

      // Get default tenant dynamically
      const defaultTenant = await getDefaultTenant();
      
      if (!defaultTenant) {
        throw new Error('No default tenant available');
      }

      console.log('useTenant: Using tenant:', defaultTenant);

      // Store tenant ID for other services
      if (defaultTenant.id) {
        await secureStorage.setItem(STORAGE_KEYS.TENANT_ID, defaultTenant.id);
      }

      // Create tenant object with proper typing
      const tenantInfo = {
        id: defaultTenant.id,
        name: defaultTenant.name || 'KisanShakti AI',
        slug: 'default',
        type: 'default',
        status: 'active',
        subscription_plan: convertSubscriptionPlan(defaultTenant.branding?.subscription_plan),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      dispatch(setCurrentTenant(tenantInfo));

      // Set branding data if available
      if (defaultTenant.branding) {
        dispatch(setTenantBranding(defaultTenant.branding));
      }

      // Set features data if available
      if (defaultTenant.features) {
        dispatch(setTenantFeatures(defaultTenant.features));
      }

      console.log('useTenant: Tenant data loaded successfully');

    } catch (error) {
      console.error('useTenant: Error loading tenant data:', error);
      setError('Failed to load tenant configuration');
      
      // Set fallback data to prevent complete failure
      const fallbackTenant = {
        id: 'fallback-tenant-id',
        name: 'KisanShakti AI',
        slug: 'default',
        type: 'default',
        status: 'active',
        subscription_plan: 'kisan' as SubscriptionPlan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dispatch(setCurrentTenant(fallbackTenant));
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      await secureStorage.setItem(STORAGE_KEYS.TENANT_ID, tenantId);
      await loadTenantData();
    } catch (error) {
      console.error('useTenant: Error switching tenant:', error);
      setError('Failed to switch tenant');
    }
  };

  return {
    tenant: currentTenant,
    branding: tenantBranding,
    features: tenantFeatures,
    loading,
    error,
    switchTenant,
    refreshTenant: loadTenantData,
  };
};
