
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Scan, Image, History, Info } from 'lucide-react';

export const InstaScan: React.FC = () => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);

  const scanOptions = [
    {
      icon: Camera,
      title: t('instaScan.diseaseDetection', 'Disease Detection'),
      description: t('instaScan.diseaseDetectionDesc', 'Scan crops for diseases and pests'),
      color: 'bg-red-500',
    },
    {
      icon: Scan,
      title: t('instaScan.nutrientAnalysis', 'Nutrient Analysis'),
      description: t('instaScan.nutrientAnalysisDesc', 'Check soil and plant health'),
      color: 'bg-green-500',
    },
    {
      icon: Image,
      title: t('instaScan.cropGrowth', 'Growth Monitoring'),
      description: t('instaScan.cropGrowthDesc', 'Track crop development stages'),
      color: 'bg-blue-500',
    },
  ];

  const recentScans = [
    { date: '2 hours ago', type: 'Disease Detection', result: 'Healthy' },
    { date: '1 day ago', type: 'Nutrient Analysis', result: 'Low Nitrogen' },
    { date: '3 days ago', type: 'Growth Monitoring', result: 'Stage 3' },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('instaScan.title', 'InstaScan')}
        </h1>
        <p className="text-gray-600">
          {t('instaScan.subtitle', 'AI-powered crop analysis at your fingertips')}
        </p>
      </div>

      {/* Quick Scan Options */}
      <div className="grid gap-4">
        {scanOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  <Button size="sm" className="shrink-0">
                    {t('instaScan.scan', 'Scan')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>{t('instaScan.recentScans', 'Recent Scans')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentScans.map((scan, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{scan.type}</p>
                <p className="text-sm text-gray-500">{scan.date}</p>
              </div>
              <Badge variant="outline">{scan.result}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">
                {t('instaScan.howItWorks', 'How InstaScan Works')}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {t('instaScan.howItWorksDesc', 'Use your camera to capture crop images. Our AI analyzes them instantly and provides actionable insights.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
