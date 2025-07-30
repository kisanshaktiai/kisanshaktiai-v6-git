
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentTenant } from '../store/slices/authSlice';
import { supabase } from '../config/supabase';
import { secureStorage } from '../services/storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';
import { useUnifiedTenantData } from './useUnifiedTenantData';

export const useTenant = () => {
  const dispatch = useDispatch();
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const [error, setError] = useState<string | null>(null);

  // Use React Query for tenant data
  const { 
    tenant, 
    branding, 
    features, 
    isLoading: loading 
  } = useUnifiedTenantData(currentTenant);

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

      dispatch(setCurrentTenant(tenantId));

    } catch (error) {
      console.error('Error loading tenant data:', error);
      setError('Failed to load tenant configuration');
    }
  };

  const switchTenant = async (tenantId: string) => {
    await secureStorage.set(STORAGE_KEYS.TENANT_ID, tenantId);
    dispatch(setCurrentTenant(tenantId));
  };

  return {
    tenant,
    branding,
    features,
    loading,
    error,
    switchTenant,
    refreshTenant: loadTenantData,
  };
};
