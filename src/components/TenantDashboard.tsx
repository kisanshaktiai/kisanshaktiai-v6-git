
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Wheat, ShoppingCart, TrendingUp, MapPin } from 'lucide-react';

interface TenantDashboardProps {
  tenantSlug: string;
}

export const TenantDashboard = ({ tenantSlug }: TenantDashboardProps) => {
  const { tenant: currentTenant, branding: tenantBranding, features: tenantFeatures, loading } = useTenant();
  const { farmer, currentAssociation } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tenant Not Found</h1>
          <p className="text-gray-600">The tenant "{tenantSlug}" does not exist.</p>
        </div>
      </div>
    );
  }

  const appName = tenantBranding?.app_name || 'KisanShakti';
  const primaryColor = tenantBranding?.primary_color || '#10B981';

  const dashboardCards = [
    {
      title: 'Total Farmers',
      value: '12,543',
      icon: Users,
      description: 'Active registered farmers',
      color: 'text-green-600',
    },
    {
      title: 'Land Area',
      value: '45,234 acres',
      icon: MapPin,
      description: 'Total cultivated area',
      color: 'text-blue-600',
    },
    {
      title: 'Active Dealers',
      value: '234',
      icon: Users,
      description: 'Dealer network partners',
      color: 'text-purple-600',
    },
    {
      title: 'Products',
      value: '1,456',
      icon: ShoppingCart,
      description: 'Available in marketplace',
      color: 'text-orange-600',
    },
    {
      title: 'AI Interactions',
      value: '98,765',
      icon: TrendingUp,
      description: 'This month',
      color: 'text-indigo-600',
    },
    {
      title: 'Crop Advisory',
      value: '5,432',
      icon: Wheat,
      description: 'Recommendations given',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {tenantBranding?.logo_url && (
                <img 
                  src={tenantBranding.logo_url} 
                  alt={appName}
                  className="h-10 w-10 rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ color: primaryColor }}>
                  {appName}
                </h1>
                <p className="text-sm text-gray-600 capitalize">
                  {currentTenant.type} Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {currentTenant.type}
              </Badge>
              {farmer && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Farmer Profile
                  </p>
                  <p className="text-xs text-gray-500">ID: {farmer.id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {appName}
          </h2>
          <p className="text-gray-600 max-w-2xl">
            {currentTenant.name || 'Your complete AgriTech solution for modern farming, connecting farmers with cutting-edge technology and expert guidance.'}
          </p>
        </div>

        {/* Feature Badges */}
        {tenantFeatures && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
            <div className="flex flex-wrap gap-2">
              {tenantFeatures.ai_chat && <Badge variant="secondary">AI Chat Assistant</Badge>}
              {tenantFeatures.weather_forecast && <Badge variant="secondary">Weather Forecasts</Badge>}
              {tenantFeatures.marketplace && <Badge variant="secondary">Marketplace</Badge>}
              {tenantFeatures.satellite_imagery && <Badge variant="secondary">Satellite Imagery</Badge>}
              {tenantFeatures.soil_testing && <Badge variant="secondary">Soil Testing</Badge>}
              {tenantFeatures.basic_analytics && <Badge variant="secondary">Analytics</Badge>}
            </div>
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <CardDescription className="text-xs">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {tenantFeatures?.ai_chat && (
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium">AI Assistant</div>
                    <div className="text-sm text-gray-600">Get farming advice</div>
                  </button>
                )}
                {tenantFeatures?.weather_forecast && (
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium">Weather</div>
                    <div className="text-sm text-gray-600">Check forecasts</div>
                  </button>
                )}
                {tenantFeatures?.marketplace && (
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium">Marketplace</div>
                    <div className="text-sm text-gray-600">Buy/sell products</div>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Weather alert issued</p>
                    <p className="text-xs text-gray-600">Heavy rainfall expected in your area</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">New crop advisory available</p>
                    <p className="text-xs text-gray-600">Kharif season recommendations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Marketplace update</p>
                    <p className="text-xs text-gray-600">New fertilizer products added</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
