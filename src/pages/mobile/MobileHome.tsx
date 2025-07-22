
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { DashboardHome } from '@/components/mobile/DashboardHome';

// Simple tenant features type
interface TenantFeaturesData {
  ai_chat?: boolean;
  weather_forecast?: boolean;
  marketplace?: boolean;
  community_forum?: boolean;
  satellite_imagery?: boolean;
  soil_testing?: boolean;
}

export const MobileHome: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useCustomAuth();
  const [features, setFeatures] = useState<TenantFeaturesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenantFeatures = async () => {
      try {
        // Set default features for now
        const defaultFeatures: TenantFeaturesData = {
          ai_chat: true,
          weather_forecast: true,
          marketplace: true,
          community_forum: true,
          satellite_imagery: true,
          soil_testing: true,
        };
        setFeatures(defaultFeatures);
      } catch (error) {
        console.error('Error loading tenant features:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantFeatures();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tenant Features Indicator */}
      {features && (
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('dashboard.welcome')} {farmer?.farmer_code || 'Farmer'}
              </h2>
              <p className="text-sm text-gray-600">
                {Object.values(features).filter(Boolean).length} features enabled
              </p>
            </div>
            <div className="flex space-x-2">
              {features.ai_chat && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="AI Chat Enabled" />
              )}
              {features.weather_forecast && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" title="Weather Enabled" />
              )}
              {features.marketplace && (
                <div className="w-2 h-2 bg-purple-500 rounded-full" title="Marketplace Enabled" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <DashboardHome />
    </div>
  );
};
