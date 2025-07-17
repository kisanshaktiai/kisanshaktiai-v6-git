import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Sprout, 
  TrendingUp, 
  Target,
  Calendar,
  Award,
  AlertCircle,
  Eye
} from 'lucide-react';

interface CropData {
  yieldTrends: Array<{
    season: string;
    crop: string;
    actualYield: number;
    predictedYield: number;
    regionalAverage: number;
  }>;
  performanceMetrics: Array<{
    crop: string;
    averageYield: number;
    bestYield: number;
    consistency: number;
    profitability: number;
    recommendation: string;
  }>;
  currentCrops: Array<{
    crop: string;
    land: string;
    stage: string;
    daysToHarvest: number;
    predictedYield: number;
    healthScore: number;
  }>;
  seasonalComparison: Array<{
    season: string;
    yield: number;
    profit: number;
  }>;
}

export const CropPerformance: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const [cropData, setCropData] = useState<CropData>({
    yieldTrends: [],
    performanceMetrics: [],
    currentCrops: [],
    seasonalComparison: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('all');

  useEffect(() => {
    if (profile?.id) {
      fetchCropData();
    }
  }, [profile?.id]);

  const fetchCropData = async () => {
    try {
      setLoading(true);
      
      // Fetch lands and crop history
      const { data: lands } = await supabase
        .from('lands')
        .select('id, name, current_crop, crop_stage, area_acres')
        .eq('farmer_id', profile?.id);

      const { data: cropHistory } = await supabase
        .from('crop_history')
        .select('*')
        .in('land_id', lands?.map(l => l.id) || [])
        .order('harvest_date', { ascending: false });

      // Fetch yield predictions
      const { data: predictions } = await supabase
        .from('yield_predictions')
        .select('*')
        .in('land_id', lands?.map(l => l.id) || [])
        .order('prediction_date', { ascending: false });

      if (cropHistory && lands) {
        // Process yield trends
        const yieldTrends = cropHistory.map(record => ({
          season: record.season || 'Unknown',
          crop: record.crop_name,
          actualYield: record.yield_kg_per_acre || 0,
          predictedYield: predictions?.find(p => 
            p.land_id === record.land_id && p.crop_name === record.crop_name
          )?.predicted_yield_per_acre || 0,
          regionalAverage: (record.yield_kg_per_acre || 0) * 0.85 // Mock regional average
        }));

        // Calculate performance metrics
        const cropMetrics = new Map();
        cropHistory.forEach(record => {
          const crop = record.crop_name;
          if (!cropMetrics.has(crop)) {
            cropMetrics.set(crop, {
              yields: [],
              profits: []
            });
          }
          cropMetrics.get(crop).yields.push(record.yield_kg_per_acre || 0);
        });

        const performanceMetrics = Array.from(cropMetrics.entries()).map(([crop, data]) => {
          const yields = data.yields.filter((y: number) => y > 0);
          const averageYield = yields.reduce((a: number, b: number) => a + b, 0) / yields.length || 0;
          const bestYield = Math.max(...yields) || 0;
          const consistency = yields.length > 1 ? 
            100 - (Math.sqrt(yields.reduce((acc: number, val: number) => acc + Math.pow(val - averageYield, 2), 0) / yields.length) / averageYield * 100) : 0;
          
          return {
            crop,
            averageYield,
            bestYield,
            consistency: Math.max(0, Math.min(100, consistency)),
            profitability: 75, // Mock profitability score
            recommendation: averageYield > bestYield * 0.8 ? 'Excellent performance' : 'Room for improvement'
          };
        });

        // Current crops status
        const currentCrops = lands?.filter(land => land.current_crop).map(land => ({
          crop: land.current_crop || '',
          land: land.name,
          stage: land.crop_stage || 'Unknown',
          daysToHarvest: Math.floor(Math.random() * 90) + 30, // Mock days
          predictedYield: predictions?.find(p => p.land_id === land.id)?.predicted_yield_per_acre || 0,
          healthScore: Math.floor(Math.random() * 30) + 70 // Mock health score
        })) || [];

        // Seasonal comparison
        const seasonalMap = new Map();
        cropHistory.forEach(record => {
          if (!seasonalMap.has(record.season)) {
            seasonalMap.set(record.season, { yield: 0, count: 0, profit: 0 });
          }
          const seasonal = seasonalMap.get(record.season);
          seasonal.yield += record.yield_kg_per_acre || 0;
          seasonal.count += 1;
          seasonal.profit += Math.random() * 50000 + 20000; // Mock profit data
        });

        const seasonalComparison = Array.from(seasonalMap.entries()).map(([season, data]) => ({
          season: season || 'Unknown',
          yield: data.yield / data.count,
          profit: data.profit / data.count
        }));

        setCropData({
          yieldTrends,
          performanceMetrics,
          currentCrops,
          seasonalComparison
        });
      }
    } catch (error) {
      console.error('Error fetching crop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const stageColors: { [key: string]: string } = {
      'seedling': 'bg-green-100 text-green-800',
      'vegetative': 'bg-blue-100 text-blue-800',
      'flowering': 'bg-yellow-100 text-yellow-800',
      'fruiting': 'bg-orange-100 text-orange-800',
      'maturity': 'bg-purple-100 text-purple-800',
      'harvest': 'bg-red-100 text-red-800'
    };
    return stageColors[stage.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
            {t('analytics.cropPerformance', 'Crop Performance')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('analytics.analyzeYieldTrends', 'Analyze yield trends and optimize production')}
          </p>
        </div>
        <Button variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          {t('analytics.viewDetails', 'View Details')}
        </Button>
      </div>

      {/* Current Crops Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sprout className="w-5 h-5 text-green-500" />
            <span>{t('analytics.currentCrops', 'Current Crops')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cropData.currentCrops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cropData.currentCrops.map((crop, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{crop.crop}</h4>
                      <p className="text-sm text-gray-600">{crop.land}</p>
                    </div>
                    <Badge className={getStageColor(crop.stage)}>
                      {crop.stage}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{t('analytics.daysToHarvest', 'Days to Harvest')}</p>
                      <p className="font-semibold">{crop.daysToHarvest} {t('common.days', 'days')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('analytics.predictedYield', 'Predicted Yield')}</p>
                      <p className="font-semibold">{crop.predictedYield.toFixed(1)} kg/acre</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('analytics.healthScore', 'Health Score')}</p>
                      <p className={`font-semibold ${getHealthColor(crop.healthScore)}`}>
                        {crop.healthScore}/100
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-gray-600 text-xs">Track progress</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('analytics.noCropsActive', 'No active crops found')}</p>
              <Button className="mt-3" size="sm">
                {t('analytics.addCrop', 'Add Crop')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span>{t('analytics.performanceMetrics', 'Performance Metrics')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cropData.performanceMetrics.map((metric, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{metric.crop}</h4>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      {metric.averageYield > metric.bestYield * 0.8 ? 
                        t('analytics.excellent', 'Excellent') : 
                        t('analytics.good', 'Good')
                      }
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{t('analytics.avgYield', 'Avg Yield')}</p>
                    <p className="font-semibold">{metric.averageYield.toFixed(1)} kg/acre</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('analytics.bestYield', 'Best Yield')}</p>
                    <p className="font-semibold text-green-600">{metric.bestYield.toFixed(1)} kg/acre</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('analytics.consistency', 'Consistency')}</p>
                    <p className="font-semibold">{metric.consistency.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('analytics.profitability', 'Profitability')}</p>
                    <p className="font-semibold">{metric.profitability}%</p>
                  </div>
                </div>
                
                {metric.recommendation && (
                  <div className="mt-3 p-2 bg-blue-50 rounded flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-sm text-blue-700">{metric.recommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Yield Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span>{t('analytics.yieldTrends', 'Yield Trends')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cropData.yieldTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="season" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actualYield" 
                stroke="#10B981" 
                strokeWidth={2}
                name={t('analytics.actualYield', 'Actual Yield')}
              />
              <Line 
                type="monotone" 
                dataKey="predictedYield" 
                stroke="#3B82F6" 
                strokeDasharray="5 5"
                name={t('analytics.predictedYield', 'Predicted Yield')}
              />
              <Line 
                type="monotone" 
                dataKey="regionalAverage" 
                stroke="#F59E0B"
                strokeWidth={1}
                name={t('analytics.regionalAverage', 'Regional Average')}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Seasonal Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.seasonalComparison', 'Seasonal Comparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cropData.seasonalComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="season" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="yield"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name={t('analytics.yield', 'Yield (kg/acre)')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};