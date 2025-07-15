
import { useState } from 'react';
import { TenantDashboard } from '@/components/TenantDashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Users, BarChart3, Smartphone } from 'lucide-react';

const Index = () => {
  const [tenantSlug, setTenantSlug] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  const handleTenantAccess = () => {
    if (tenantSlug.trim()) {
      setShowDashboard(true);
    }
  };

  if (showDashboard) {
    return <TenantDashboard tenantSlug={tenantSlug} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            KisanShaktiAI V6
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Empowering 10M+ farmers across India with AI-driven AgriTech solutions. 
            Multi-tenant SaaS platform serving AgriCompanies, Dealers, NGOs, and Government organizations.
          </p>
          
          {/* Tenant Access */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Tenant Dashboard</CardTitle>
              <CardDescription>
                Enter your organization's slug to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="e.g., mahindra-agri, iffco, government-up"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTenantAccess()}
              />
              <Button 
                onClick={handleTenantAccess} 
                className="w-full"
                disabled={!tenantSlug.trim()}
              >
                Access Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sprout className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>AI-Powered Advisory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Intelligent crop recommendations, disease detection, and personalized farming guidance
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Multi-Tenant Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Secure, isolated environments for different organizations with white-label customization
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time insights, predictive analytics, and comprehensive reporting for data-driven decisions
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Smartphone className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Offline-First Mobile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Works seamlessly in rural areas with offline sync and multilingual voice support
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Types */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Serving Diverse Organizations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              'AgriCompany', 'Dealer Networks', 'NGOs', 'Government',
              'Universities', 'Sugar Factories', 'Cooperatives', 'Insurance'
            ].map((type) => (
              <div key={type} className="bg-white rounded-lg p-4 shadow-sm border">
                <p className="font-medium text-gray-800">{type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Tenant Slugs */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Try Sample Tenant Dashboards</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'mahindra-agri',
              'iffco-cooperative',
              'government-up',
              'tata-chemicals',
              'sample-dealer'
            ].map((slug) => (
              <Button
                key={slug}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTenantSlug(slug);
                  setShowDashboard(true);
                }}
                className="text-sm"
              >
                {slug}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
