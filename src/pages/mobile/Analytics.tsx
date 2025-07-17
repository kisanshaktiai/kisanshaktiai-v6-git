import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Sprout,
  Droplets,
  FileBarChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  Calculator
} from 'lucide-react';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { FinancialAnalytics } from '@/components/analytics/FinancialAnalytics';
import { CropPerformance } from '@/components/analytics/CropPerformance';
import { ResourceUtilization } from '@/components/analytics/ResourceUtilization';
import { MarketIntelligence } from '@/components/analytics/MarketIntelligence';
import { ReportGeneration } from '@/components/analytics/ReportGeneration';

export const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: t('analytics.overview', 'Overview'),
      icon: BarChart3,
      component: AnalyticsOverview
    },
    {
      id: 'financial',
      label: t('analytics.financial', 'Financial'),
      icon: DollarSign,
      component: FinancialAnalytics
    },
    {
      id: 'crops',
      label: t('analytics.crops', 'Crops'),
      icon: Sprout,
      component: CropPerformance
    },
    {
      id: 'resources',
      label: t('analytics.resources', 'Resources'),
      icon: Droplets,
      component: ResourceUtilization
    },
    {
      id: 'market',
      label: t('analytics.market', 'Market'),
      icon: TrendingUp,
      component: MarketIntelligence
    },
    {
      id: 'reports',
      label: t('analytics.reports', 'Reports'),
      icon: FileBarChart,
      component: ReportGeneration
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t('analytics.title', 'Analytics Dashboard')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('analytics.subtitle', 'Insights for better farming decisions')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {tabs.slice(0, 3).map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Secondary Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {tabs.slice(3).map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id}>
                <Component />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};