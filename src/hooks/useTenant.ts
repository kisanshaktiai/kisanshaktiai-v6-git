
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentTenant, setTenantBranding, setTenantFeatures } from '../store/slices/tenantSlice';
import { supabase } from '../config/supabase';
import { secureStorage } from '../services/storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';

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
      // Try to get tenant ID from storage
      let tenantId = await secureStorage.get(STORAGE_KEYS.TENANT_ID);
      
      if (!tenantId) {
        // Default to valid UUID tenant if none found
        tenantId = '00000000-0000-0000-0000-000000000001';
        await secureStorage.set(STORAGE_KEYS.TENANT_ID, tenantId);
      }

      // Load tenant data
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        console.warn('Tenant not found, using default');
        // Create default tenant data
        dispatch(setCurrentTenant({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'KisanShakti AI',
          slug: 'default',
          type: 'default',
        }));
        return;
      }

      dispatch(setCurrentTenant(tenant));

      // Load branding
      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (branding) {
        dispatch(setTenantBranding(branding));
      }

      // Load features
      const { data: features } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (features) {
        dispatch(setTenantFeatures(features));
      }

    } catch (error) {
      console.error('Error loading tenant data:', error);
      setError('Failed to load tenant configuration');
    }
  };

  const switchTenant = async (tenantId: string) => {
    await secureStorage.set(STORAGE_KEYS.TENANT_ID, tenantId);
    await loadTenantData();
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
