
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentTenant, setTenantBranding, setTenantFeatures } from '../store/slices/tenantSlice';
import { supabase } from '../integrations/supabase/client';
import { secureStorage } from '../services/storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';
import { DEFAULT_TENANT_ID } from '../config/constants';

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
      
      // Try to get tenant ID from storage
      let tenantId = await secureStorage.get(STORAGE_KEYS.TENANT_ID);
      
      if (!tenantId) {
        // Default to the default tenant if none found
        tenantId = DEFAULT_TENANT_ID;
        await secureStorage.set(STORAGE_KEYS.TENANT_ID, tenantId);
      }

      console.log('Loading tenant data for ID:', tenantId);

      // Load tenant data with improved error handling
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();

      if (tenantError) {
        console.warn('Tenant query error, using fallback:', tenantError);
      }

      if (!tenant) {
        console.log('Tenant not found, using default configuration');
        // Create default tenant data
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

      // Load branding with fallback
      try {
        const { data: branding } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (branding) {
          dispatch(setTenantBranding(branding));
        }
      } catch (brandingError) {
        console.warn('Non-critical branding load error:', brandingError);
      }

      // Load features with fallback
      try {
        const { data: features } = await supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (features) {
          dispatch(setTenantFeatures(features));
        }
      } catch (featuresError) {
        console.warn('Non-critical features load error:', featuresError);
      }

    } catch (error) {
      console.error('Error loading tenant data:', error);
      setError('Failed to load tenant configuration');
      
      // Set fallback data to prevent complete failure
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
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      await secureStorage.set(STORAGE_KEYS.TENANT_ID, tenantId);
      await loadTenantData();
    } catch (error) {
      console.error('Error switching tenant:', error);
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
