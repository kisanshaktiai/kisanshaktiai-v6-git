
import { useEffect, useState } from 'react';
import { useTenant } from './useTenant';

interface TenantData {
  tenant: any;
  branding: any;
  features: any;
}

export const useTenantContext = () => {
  const { tenant, branding, features, loading, error, refreshTenant } = useTenant();
  
  const [tenantData, setTenantData] = useState<TenantData | null>(null);

  useEffect(() => {
    if (tenant) {
      setTenantData({
        tenant,
        branding,
        features
      });
    }
  }, [tenant, branding, features]);

  const getCurrentTenantId = () => {
    return tenant?.id || null;
  };

  const switchTenant = async (tenantId: string) => {
    // This functionality would need to be implemented in the main useTenant hook
    console.log('Switch tenant functionality needs to be implemented');
  };

  return {
    tenantData,
    loading,
    error,
    getCurrentTenantId,
    switchTenant,
    refreshTenantData: refreshTenant
  };
};
