
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MarketplaceHome } from '@/components/marketplace/MarketplaceHome';

export const Market: React.FC = () => {
  const { t } = useTranslation();
  
  return <MarketplaceHome />;
};
