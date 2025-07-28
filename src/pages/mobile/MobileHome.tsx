
import React from 'react';
import { ModernTenantDashboard } from '@/components/mobile/dashboard/ModernTenantDashboard';
import { TenantErrorBoundary } from '@/components/common/TenantErrorBoundary';

export default function MobileHome() {
  return (
    <TenantErrorBoundary>
      <ModernTenantDashboard />
    </TenantErrorBoundary>
  );
}
