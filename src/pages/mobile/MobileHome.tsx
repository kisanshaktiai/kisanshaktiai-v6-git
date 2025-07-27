
import React from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { DashboardHome } from '@/components/mobile/DashboardHome';

export default function MobileHome() {
  return (
    <MobileLayout showHeader={false}>
      <DashboardHome />
    </MobileLayout>
  );
}
