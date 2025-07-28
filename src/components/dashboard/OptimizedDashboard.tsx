import React, { useState, useEffect } from 'react';
import { UltraOptimizedDataService } from '@/services/UltraOptimizedDataService';
import { PerformanceCache } from '@/services/PerformanceCache';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, Leaf, DollarSign } from 'lucide-react';

export const OptimizedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<string>('loading');

  const dataService = UltraOptimizedDataService.getInstance();
  const cache = PerformanceCache.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, [user?.id, tenant?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    console.log('🚀 Loading optimized dashboard data...');

    try {
      const startTime = Date.now();
      
      const data = await dataService.getDashboardData(
        tenant?.id || 'default',
        user.id,
        false // Don't force refresh initially
      );

      const loadTime = Date.now() - startTime;
      
      setDashboardData(data);
      setCacheStatus(data.cached ? `Cache Hit (${loadTime}ms)` : `Fresh Data (${loadTime}ms)`);
      
      console.log('✅ Dashboard loaded in', loadTime, 'ms');
      
      // Start background preloading
      setTimeout(() => {
        dataService.preloadTenantData(tenant?.id || 'default', user.id);
      }, 1000);

    } catch (error) {
      console.error('❌ Dashboard load failed:', error);
      setCacheStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};

  return (
    <div className="p-6 space-y-6">
      {/* Performance Indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${
            cacheStatus.includes('Cache Hit') ? 'bg-green-500' : 
            cacheStatus.includes('Fresh') ? 'bg-blue-500' : 'bg-red-500'
          }`}></div>
          <span>{cacheStatus}</span>
          <button 
            onClick={handleRefresh}
            className="ml-2 px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lands</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_lands || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total_area_acres || 0} acres total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Crops</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.active_crops || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently growing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recent_activities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.total_expenses?.toFixed(0) || 0}</div>
            <p className="text-xs text-muted-foreground">
              Recent period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lands */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData?.lands?.slice(0, 5).map((land: any) => (
              <div key={land.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium">{land.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {land.area_acres} acres • {land.soil_type || 'Unknown soil'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {land.crop_history?.length || 0} crops
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {land.irrigation_type || 'No irrigation'}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-muted-foreground py-8">
                No lands found. Add your first land to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {cache.getCacheStats().memorySize}
              </div>
              <div className="text-xs text-muted-foreground">Cache Items</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {dataService.getPerformanceMetrics().pendingRequests}
              </div>
              <div className="text-xs text-muted-foreground">Pending Requests</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {dashboardData?.performance_metrics?.query_time ? 
                  `${Date.now() - dashboardData.performance_metrics.query_time}ms` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};