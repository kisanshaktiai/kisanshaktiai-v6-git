
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sprout, 
  MessageCircle, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  CloudSun, 
  Users, 
  Satellite,
  BarChart3,
  Settings
} from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { isOnline } = useSelector((state: RootState) => state.sync);

  const quickActions = [
    {
      id: 'ai-chat',
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Get instant farming advice',
      color: 'bg-blue-500',
      route: '/ai-chat'
    },
    {
      id: 'my-lands',
      icon: Sprout,
      title: 'My Lands',
      description: 'Manage your fields',
      color: 'bg-emerald-500',
      route: '/my-lands'
    },
    {
      id: 'crop-schedule',
      icon: Calendar,
      title: 'Crop Calendar',
      description: 'View farming tasks',
      color: 'bg-green-500',
      route: '/crop-schedule'
    },
    {
      id: 'marketplace',
      icon: TrendingUp,
      title: 'Marketplace',
      description: 'Buy & Sell',
      color: 'bg-orange-500',
      route: '/market'
    },
    {
      id: 'weather',
      icon: CloudSun,
      title: 'Weather',
      description: 'Local forecast',
      color: 'bg-yellow-500',
      route: '/weather'
    },
    {
      id: 'community',
      icon: Users,
      title: 'Community',
      description: 'Connect with farmers',
      color: 'bg-purple-500',
      route: '/community'
    },
    {
      id: 'satellite',
      icon: Satellite,
      title: 'Satellite Data',
      description: 'NDVI & crop health',
      color: 'bg-indigo-500',
      route: '/satellite'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Analytics',
      description: 'Performance insights',
      color: 'bg-pink-500',
      route: '/analytics'
    }
  ];

  const todayStats = [
    { label: 'Weather', value: '28°C, Sunny', color: 'text-yellow-600' },
    { label: 'Tasks', value: '3 Pending', color: 'text-orange-600' },
    { label: 'Messages', value: '2 New', color: 'text-blue-600' },
    { label: 'Crops', value: '4 Active', color: 'text-green-600' }
  ];

  const handleQuickAction = (route: string) => {
    navigate(route);
  };

  // Helper function to safely get farmer name
  const getFarmerName = (): string => {
    if (!profile?.name) return 'Farmer';
    
    if (typeof profile.name === 'string') {
      return profile.name.split(' ')[0];
    }
    
    // Handle multilingual name object
    if (typeof profile.name === 'object' && profile.name !== null) {
      const nameObj = profile.name as any;
      const nameValue = nameObj.en || nameObj.hi || Object.values(nameObj)[0];
      if (nameValue && typeof nameValue === 'string') {
        return nameValue.split(' ')[0];
      }
    }
    
    return 'Farmer';
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Namaste, {getFarmerName()}! 🙏
          </h1>
          <p className="text-gray-600">Welcome back to your dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/profile')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Today's Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {todayStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className={`font-semibold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95"
                onClick={() => handleQuickAction(action.route)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mb-3 mx-auto`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 text-sm">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Wheat crop watered</p>
              <p className="text-xs text-gray-500">Field 1 • 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">AI chat: Pest control advice</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Market price update received</p>
              <p className="text-xs text-gray-500">Yesterday</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Widget */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Today's Weather</h3>
              <p className="text-2xl font-bold text-blue-600">28°C</p>
              <p className="text-sm text-gray-600">Sunny, Good for irrigation</p>
            </div>
            <CloudSun className="w-12 h-12 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
