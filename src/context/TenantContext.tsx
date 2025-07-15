
import React, { createContext, useContext } from 'react';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Tenant, TenantBranding, TenantFeatures, UserProfile, UserTenant } from '@/types/tenant';
import { User } from '@supabase/supabase-js';

interface TenantContextType {
  user: User | null;
  profile: UserProfile | null;
  currentTenant: Tenant | null;
  userTenants: UserTenant[];
  tenantBranding: TenantBranding | null;
  tenantFeatures: TenantFeatures | null;
  loading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refetch: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const tenantAuth = useTenantAuth();

  return (
    <TenantContext.Provider value={tenantAuth}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
