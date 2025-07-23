
import { useEffect, useState } from 'react';
import { tenantService } from '@/services/TenantService';

interface TenantData {
  tenant: any;
  branding: any;
  features: any;
}

export const useTenantContext = () => {
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenantData();
  }, []);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading tenant context data');
      
      const data = await tenantService.getTenantData();
      setTenantData(data);
      console.log('Tenant context data loaded successfully:', data);
    } catch (err) {
      console.error('Error loading tenant context data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
      
      // Set fallback data
      setTenantData({
        tenant: {
          id: 'fallback-tenant-id',
          name: 'KisanShakti AI',
          slug: 'default',
          type: 'default'
        },
        branding: null,
        features: null
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTenantId = () => {
    return tenantData?.tenant?.id || 'fallback-tenant-id';
  };

  const switchTenant = async (tenantId: string) => {
    try {
      tenantService.setCurrentTenantId(tenantId);
      await loadTenantData();
    } catch (err) {
      console.error('Error switching tenant:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch tenant');
    }
  };

  return {
    tenantData,
    loading,
    error,
    getCurrentTenantId,
    switchTenant,
    refreshTenantData: loadTenantData
  };
};
