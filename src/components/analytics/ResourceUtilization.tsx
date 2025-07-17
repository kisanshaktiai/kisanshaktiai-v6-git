import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Droplets, 
  Zap, 
  Users, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Target
} from 'lucide-react';

interface ResourceData {
  waterUsage: Array<{
    month: string;
    usage: number;
    efficiency: number;
    cost: number;
  }>;
  fertilizerEfficiency: Array<{
    type: string;
    applied: number;
    effectiveness: number;
    cost: number;
  }>;
  laborAnalytics: Array<{
    activity: string;
    hours: number;
    cost: number;
    efficiency: number;
  }>;
  equipmentUtilization: Array<{
    equipment: string;
    utilizationRate: number;
    maintenanceCost: number;
    breakdown: boolean;
  }>;
  wastageData: Array<{
    resource: string;
    wastage: number;
    value: number;
    recommendation: string;
  }>;
  resourceSummary: {
    totalWaterUsed: number;
    waterEfficiency: number;
    fertilizerCost: number;
    laborCost: number;
    equipmentEfficiency: number;
  };
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export const ResourceUtilization: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const [resourceData, setResourceData] = useState<ResourceData>({
    waterUsage: [],
    fertilizerEfficiency: [],
    laborAnalytics: [],
    equipmentUtilization: [],
    wastageData: [],
    resourceSummary: {
      totalWaterUsed: 0,
      waterEfficiency: 0,
      fertilizerCost: 0,
      laborCost: 0,
      equipmentEfficiency: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchResourceData();
    }
  }, [profile?.id]);

  const fetchResourceData = async () => {
    try {
      setLoading(true);
      
      // Fetch lands
      const { data: lands } = await supabase
        .from('lands')
        .select('id')
        .eq('farmer_id', profile?.id);

      // Fetch resource usage data
      const { data: resourceUsage } = await supabase
        .from('resource_usage')
        .select('*')
        .in('land_id', lands?.map(l => l.id) || [])
        .order('usage_date', { ascending: false });

      if (resourceUsage) {
        // Process water usage by month
        const waterMap = new Map();
        const fertilizerMap = new Map();
        const laborMap = new Map();
        const equipmentSet = new Set();

        let totalWaterCost = 0;
        let totalFertilizerCost = 0;
        let totalLaborCost = 0;

        resourceUsage.forEach(usage => {
          const date = new Date(usage.usage_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });

          switch (usage.resource_type) {
            case 'water':
              if (!waterMap.has(monthKey)) {
                waterMap.set(monthKey, {
                  month: monthName,
                  usage: 0,
                  efficiency: 0,
                  cost: 0,
                  count: 0
                });
              }
              const waterData = waterMap.get(monthKey);
              waterData.usage += usage.quantity;
              waterData.cost += usage.total_cost || 0;
              waterData.efficiency += usage.effectiveness_rating || 3;
              waterData.count += 1;
              totalWaterCost += usage.total_cost || 0;
              break;

            case 'fertilizer':
              const fertKey = usage.resource_name;
              if (!fertilizerMap.has(fertKey)) {
                fertilizerMap.set(fertKey, {
                  type: fertKey,
                  applied: 0,
                  effectiveness: 0,
                  cost: 0,
                  count: 0
                });
              }
              const fertData = fertilizerMap.get(fertKey);
              fertData.applied += usage.quantity;
              fertData.cost += usage.total_cost || 0;
              fertData.effectiveness += usage.effectiveness_rating || 3;
              fertData.count += 1;
              totalFertilizerCost += usage.total_cost || 0;
              break;

            case 'labor':
              const laborKey = usage.resource_name;
              if (!laborMap.has(laborKey)) {
                laborMap.set(laborKey, {
                  activity: laborKey,
                  hours: 0,
                  cost: 0,
                  efficiency: 0,
                  count: 0
                });
              }
              const laborData = laborMap.get(laborKey);
              laborData.hours += usage.quantity;
              laborData.cost += usage.total_cost || 0;
              laborData.efficiency += usage.effectiveness_rating || 3;
              laborData.count += 1;
              totalLaborCost += usage.total_cost || 0;
              break;

            case 'equipment':
              equipmentSet.add(usage.resource_name);
              break;
          }
        });

        // Convert maps to arrays and calculate averages
        const waterUsage = Array.from(waterMap.values()).map(data => ({
          ...data,
          efficiency: data.count > 0 ? (data.efficiency / data.count) * 20 : 0 // Convert to percentage
        }));

        const fertilizerEfficiency = Array.from(fertilizerMap.values()).map(data => ({
          type: data.type,
          applied: data.applied,
          effectiveness: data.count > 0 ? (data.effectiveness / data.count) * 20 : 0,
          cost: data.cost
        }));

        const laborAnalytics = Array.from(laborMap.values()).map(data => ({
          activity: data.activity,
          hours: data.hours,
          cost: data.cost,
          efficiency: data.count > 0 ? (data.efficiency / data.count) * 20 : 0
        }));

        // Mock equipment data (would be calculated from actual equipment usage)
        const equipmentUtilization = Array.from(equipmentSet).map(equipment => ({
          equipment: String(equipment),
          utilizationRate: Math.random() * 40 + 60, // 60-100%
          maintenanceCost: Math.random() * 5000 + 2000,
          breakdown: Math.random() < 0.2 // 20% chance of breakdown
        }));

        // Mock wastage data
        const wastageData = [
          {
            resource: 'Water',
            wastage: 15,
            value: 5000,
            recommendation: 'Install drip irrigation system'
          },
          {
            resource: 'Fertilizer',
            wastage: 8,
            value: 3200,
            recommendation: 'Use soil testing for precise application'
          },
          {
            resource: 'Seeds',
            wastage: 5,
            value: 1500,
            recommendation: 'Improve storage conditions'
          }
        ];

        const resourceSummary = {
          totalWaterUsed: waterUsage.reduce((sum, data) => sum + data.usage, 0),
          waterEfficiency: waterUsage.length > 0 ? 
            waterUsage.reduce((sum, data) => sum + data.efficiency, 0) / waterUsage.length : 0,
          fertilizerCost: totalFertilizerCost,
          laborCost: totalLaborCost,
          equipmentEfficiency: equipmentUtilization.length > 0 ?
            equipmentUtilization.reduce((sum, data) => sum + data.utilizationRate, 0) / equipmentUtilization.length : 0
        };

        setResourceData({
          waterUsage,
          fertilizerEfficiency,
          laborAnalytics,
          equipmentUtilization,
          wastageData,
          resourceSummary
        });
      }
    } catch (error) {
      console.error('Error fetching resource data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('analytics.resourceUtilization', 'Resource Utilization')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('analytics.optimizeResourceUsage', 'Optimize your resource usage and reduce costs')}
          </p>
        </div>
        <Button variant="outline">
          <Target className="w-4 h-4 mr-2" />
          {t('analytics.setTargets', 'Set Targets')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.waterUsed', 'Water Used')}</p>
                <p className="text-xl font-bold">{resourceData.resourceSummary.totalWaterUsed.toLocaleString()} L</p>
                <p className="text-xs text-gray-500">
                  {resourceData.resourceSummary.waterEfficiency.toFixed(1)}% {t('analytics.efficiency', 'efficiency')}
                </p>
              </div>
              <Droplets className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.fertilizerCost', 'Fertilizer Cost')}</p>
                <p className="text-xl font-bold">{formatCurrency(resourceData.resourceSummary.fertilizerCost)}</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.laborCost', 'Labor Cost')}</p>
                <p className="text-xl font-bold">{formatCurrency(resourceData.resourceSummary.laborCost)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.equipmentEfficiency', 'Equipment Efficiency')}</p>
                <p className="text-xl font-bold">{resourceData.resourceSummary.equipmentEfficiency.toFixed(1)}%</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Water Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span>{t('analytics.waterUsageTrends', 'Water Usage Trends')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceData.waterUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="usage" 
                fill="#3B82F6" 
                name={t('analytics.waterUsage', 'Water Usage (L)')}
              />
              <Bar 
                yAxisId="right"
                dataKey="efficiency" 
                fill="#10B981" 
                name={t('analytics.efficiency', 'Efficiency (%)')}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Equipment Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-orange-500" />
            <span>{t('analytics.equipmentUtilization', 'Equipment Utilization')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resourceData.equipmentUtilization.map((equipment, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{equipment.equipment}</h4>
                    {equipment.breakdown && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t('analytics.needsRepair', 'Needs Repair')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{equipment.utilizationRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{t('analytics.utilization', 'Utilization')}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('analytics.utilizationRate', 'Utilization Rate')}</span>
                    <span>{equipment.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={equipment.utilizationRate} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('analytics.maintenanceCost', 'Maintenance Cost')}</span>
                    <span>{formatCurrency(equipment.maintenanceCost)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Wastage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span>{t('analytics.resourceWastage', 'Resource Wastage Analysis')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resourceData.wastageData.map((wastage, index) => (
              <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{wastage.resource}</h4>
                  <Badge variant="destructive">{wastage.wastage}% {t('analytics.wastage', 'wastage')}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">{t('analytics.wastedValue', 'Wasted Value')}</p>
                    <p className="font-semibold text-red-600">{formatCurrency(wastage.value)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('analytics.wastageRate', 'Wastage Rate')}</p>
                    <p className="font-semibold text-red-600">{wastage.wastage}%</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {t('analytics.recommendation', 'Recommendation')}
                    </p>
                    <p className="text-sm text-blue-700">{wastage.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Labor Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span>{t('analytics.laborAnalytics', 'Labor Analytics')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceData.laborAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="hours" 
                fill="#8B5CF6" 
                name={t('analytics.hours', 'Hours')}
              />
              <Bar 
                yAxisId="left"
                dataKey="cost" 
                fill="#EF4444" 
                name={t('analytics.cost', 'Cost (₹)')}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};