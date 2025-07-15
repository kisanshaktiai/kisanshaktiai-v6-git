
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprout, MessageCircle, Calendar, TrendingUp } from 'lucide-react';

export const MobileHome: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { isOnline } = useSelector((state: RootState) => state.sync);

  const quickActions = [
    {
      icon: MessageCircle,
      title: 'AI Chat',
      description: 'Get farming advice',
      color: 'bg-blue-500',
    },
    {
      icon: Calendar,
      title: 'Crop Schedule',
      description: 'View upcoming tasks',
      color: 'bg-green-500',
    },
    {
      icon: TrendingUp,
      title: 'Market Prices',
      description: 'Check latest rates',
      color: 'bg-orange-500',
    },
    {
      icon: Sprout,
      title: 'My Lands',
      description: 'Manage your fields',
      color: 'bg-emerald-500',
    },
  ];

  // Helper function to safely convert translation result to string
  const getTranslation = (key: string, fallback: string): string => {
    const result = t(key);
    if (typeof result === 'string') return result;
    return fallback;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getTranslation('common.welcome', 'Welcome')}, {typeof profile?.name === 'string' ? profile.name : profile?.name?.en || 'Farmer'}!
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? getTranslation('common.online', 'Online') : getTranslation('common.offline', 'Offline')}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mb-3 mx-auto`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Weather</span>
            <span className="font-medium">28°C, Sunny</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Tasks Pending</span>
            <Badge variant="outline">3</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">AI Messages</span>
            <Badge variant="outline">2 New</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
