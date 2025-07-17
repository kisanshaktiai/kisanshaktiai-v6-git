import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Calendar } from 'lucide-react';

interface HealthAnalyticsProps {
  landId: string;
  healthAssessments: any[];
  ndviData: any[];
}

const HealthAnalytics: React.FC<HealthAnalyticsProps> = ({
  landId,
  healthAssessments,
  ndviData
}) => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [metric, setMetric] = useState<'health' | 'ndvi' | 'yield'>('health');

  const getFilteredData = () => {
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return {
      health: healthAssessments.filter(h => 
        new Date(h.assessment_date) >= cutoffDate
      ).reverse(),
      ndvi: ndviData.filter(n => 
        new Date(n.date) >= cutoffDate
      ).reverse()
    };
  };

  const { health: filteredHealth, ndvi: filteredNdvi } = getFilteredData();

  const getHealthTrend = () => {
    if (filteredHealth.length < 2) return null;
    const latest = filteredHealth[filteredHealth.length - 1].overall_health_score;
    const previous = filteredHealth[filteredHealth.length - 2].overall_health_score;
    return latest - previous;
  };

  const getAverageHealth = () => {
    if (filteredHealth.length === 0) return 0;
    return filteredHealth.reduce((sum, h) => sum + h.overall_health_score, 0) / filteredHealth.length;
  };

  const getProblemAreas = () => {
    const latest = filteredHealth[filteredHealth.length - 1];
    return latest?.problem_areas || [];
  };

  const getStressIndicators = () => {
    const latest = filteredHealth[filteredHealth.length - 1];
    return latest?.stress_indicators || {};
  };

  const getRecommendations = () => {
    const latest = filteredHealth[filteredHealth.length - 1];
    return latest?.recommendations || [];
  };

  const chartData = filteredHealth.map((assessment, index) => {
    const correspondingNdvi = filteredNdvi.find(n => 
      Math.abs(new Date(n.date).getTime() - new Date(assessment.assessment_date).getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    
    return {
      date: new Date(assessment.assessment_date).toLocaleDateString(),
      health: assessment.overall_health_score,
      ndvi: correspondingNdvi?.ndvi_value ? correspondingNdvi.ndvi_value * 100 : null,
      predicted_yield: assessment.predicted_yield
    };
  });

  const healthTrend = getHealthTrend();
  const averageHealth = getAverageHealth();
  const problemAreas = getProblemAreas();
  const stressIndicators = getStressIndicators();
  const recommendations = getRecommendations();

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStressLevel = (indicator: any) => {
    if (!indicator) return null;
    const level = indicator.level;
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Controls</CardTitle>
          <CardDescription>Configure the health analysis view</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Primary Metric</label>
            <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health">Health Score</SelectItem>
                <SelectItem value="ndvi">NDVI Trend</SelectItem>
                <SelectItem value="yield">Yield Prediction</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Health</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getHealthColor(averageHealth)}`}>
                    {averageHealth.toFixed(0)}
                  </p>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                {healthTrend !== null && healthTrend >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {healthTrend !== null ? (
                      <>
                        {healthTrend >= 0 ? '+' : ''}{healthTrend.toFixed(1)}
                      </>
                    ) : '--'}
                  </p>
                  {healthTrend !== null && (
                    <Badge variant={healthTrend >= 0 ? 'default' : 'destructive'}>
                      {healthTrend >= 0 ? 'Improving' : 'Declining'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problem Areas</p>
                <p className="text-2xl font-bold">{problemAreas.length}</p>
                <p className="text-xs text-muted-foreground">
                  {problemAreas.reduce((sum, area) => sum + (area.area_percentage || 0), 0).toFixed(1)}% affected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assessments</p>
                <p className="text-2xl font-bold">{filteredHealth.length}</p>
                <p className="text-xs text-muted-foreground">
                  Last: {filteredHealth.length > 0 ? 
                    new Date(filteredHealth[filteredHealth.length - 1].assessment_date).toLocaleDateString() : 
                    'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Health Score Trend</CardTitle>
            <CardDescription>Health score over time with NDVI correlation</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="health" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Health Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ndvi" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="NDVI (×100)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* NDVI Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>NDVI Distribution</CardTitle>
            <CardDescription>NDVI values distribution over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredNdvi.map(n => ({
                  date: new Date(n.date).toLocaleDateString(),
                  ndvi: n.ndvi_value,
                  evi: n.evi_value,
                  ndwi: n.ndwi_value
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="ndvi" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="NDVI"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stress Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Current Stress Indicators</CardTitle>
            <CardDescription>Latest stress analysis from satellite data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(stressIndicators).length > 0 ? (
              Object.entries(stressIndicators).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">
                      {key.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {(value.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <Badge className={getStressLevel(value)}>
                    {value.level}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No stress indicators detected</p>
                <p className="text-sm">Crop appears healthy</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problem Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Areas</CardTitle>
            <CardDescription>Areas requiring attention based on satellite analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {problemAreas.length > 0 ? (
              problemAreas.map((area: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium capitalize">
                      {area.type?.replace('_', ' ')}
                    </p>
                    <Badge variant={area.severity === 'high' ? 'destructive' : 'secondary'}>
                      {area.severity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Area: {area.area_percentage?.toFixed(1)}%</div>
                    <div>Location: {area.location}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No problem areas detected</p>
                <p className="text-sm">Field appears uniform</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
            <CardDescription>Action items based on satellite analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority} priority
                    </Badge>
                    <span className="text-sm text-muted-foreground capitalize">
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-sm">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthAnalytics;