
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
      
      console.log('useTenantContext: Loading tenant context data');
      
      const data = await tenantService.getTenantData();
      setTenantData(data);
      console.log('useTenantContext: Tenant context data loaded successfully:', data);
    } catch (err) {
      console.error('useTenantContext: Error loading tenant context data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
      
      // Set fallback data
      setTenantData({
        tenant: {
          id: crypto.randomUUID(),
          name: 'KisanShakti AI',
          slug: 'fallback',
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
    return tenantData?.tenant?.id || 'no-tenant-available';
  };

  const switchTenant = async (tenantId: string) => {
    try {
      tenantService.setCurrentTenantId(tenantId);
      await loadTenantData();
    } catch (err) {
      console.error('useTenantContext: Error switching tenant:', err);
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
