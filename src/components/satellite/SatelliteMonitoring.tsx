import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Satellite, Zap, TrendingDown, TrendingUp, AlertTriangle, Download, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NDVIVisualization from './NDVIVisualization';
import HealthAnalytics from './HealthAnalytics';
import SatelliteAlerts from './SatelliteAlerts';
import PrescriptionMaps from './PrescriptionMaps';

interface SatelliteMonitoringProps {
  selectedLandId?: string;
}

const SatelliteMonitoring: React.FC<SatelliteMonitoringProps> = ({ selectedLandId }) => {
  const [lands, setLands] = useState<any[]>([]);
  const [selectedLand, setSelectedLand] = useState<string | null>(selectedLandId || null);
  const [ndviData, setNdviData] = useState<any[]>([]);
  const [healthAssessments, setHealthAssessments] = useState<any[]>([]);
  const [satelliteImagery, setSatelliteImagery] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingLand, setProcessingLand] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    fetchLands();
  }, []);

  useEffect(() => {
    if (selectedLand) {
      fetchSatelliteData();
      fetchAlerts();
    }
  }, [selectedLand]);

  const fetchLands = async () => {
    const { data, error } = await supabase
      .from('lands')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch lands');
      return;
    }

    setLands(data || []);
    if (data && data.length > 0 && !selectedLand) {
      setSelectedLand(data[0].id);
    }
  };

  const fetchSatelliteData = async () => {
    if (!selectedLand) return;

    setLoading(true);
    
    // Fetch NDVI data
    const { data: ndviData, error: ndviError } = await supabase
      .from('ndvi_data')
      .select('*')
      .eq('land_id', selectedLand)
      .order('date', { ascending: false })
      .limit(30);

    if (ndviError) {
      console.error('Error fetching NDVI data:', ndviError);
    } else {
      setNdviData(ndviData || []);
    }

    // Fetch health assessments
    const { data: healthData, error: healthError } = await supabase
      .from('crop_health_assessments')
      .select('*')
      .eq('land_id', selectedLand)
      .order('assessment_date', { ascending: false })
      .limit(10);

    if (healthError) {
      console.error('Error fetching health assessments:', healthError);
    } else {
      setHealthAssessments(healthData || []);
    }

    // Fetch satellite imagery
    const { data: imageryData, error: imageryError } = await supabase
      .from('satellite_imagery')
      .select('*')
      .eq('land_id', selectedLand)
      .order('acquisition_date', { ascending: false })
      .limit(10);

    if (imageryError) {
      console.error('Error fetching satellite imagery:', imageryError);
    } else {
      setSatelliteImagery(imageryData || []);
    }

    setLoading(false);
  };

  const fetchAlerts = async () => {
    if (!selectedLand) return;

    const { data, error } = await supabase
      .from('satellite_alerts')
      .select('*')
      .eq('land_id', selectedLand)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
    } else {
      setAlerts(data || []);
    }
  };

  const processSatelliteData = async (landId: string) => {
    setProcessingLand(landId);
    
    try {
      const { data, error } = await supabase.functions.invoke('satellite-processor', {
        body: { landId }
      });

      if (error) throw error;

      toast.success('Satellite data processed successfully');
      await fetchSatelliteData();
      await fetchAlerts();
    } catch (error) {
      console.error('Error processing satellite data:', error);
      toast.error('Failed to process satellite data');
    } finally {
      setProcessingLand(null);
    }
  };

  const downloadImagery = async (imagery: any) => {
    toast.info('Download functionality would be implemented here');
  };

  const getCurrentHealthScore = () => {
    if (healthAssessments.length === 0) return null;
    return healthAssessments[0].overall_health_score;
  };

  const getLatestNDVI = () => {
    if (ndviData.length === 0) return null;
    return ndviData[0].ndvi_value;
  };

  const getHealthTrend = () => {
    if (healthAssessments.length < 2) return null;
    const current = healthAssessments[0].overall_health_score;
    const previous = healthAssessments[1].overall_health_score;
    return current - previous;
  };

  const selectedLandInfo = lands.find(land => land.id === selectedLand);
  const currentHealth = getCurrentHealthScore();
  const latestNDVI = getLatestNDVI();
  const healthTrend = getHealthTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Satellite className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Satellite Monitoring</h1>
            <p className="text-muted-foreground">NDVI & crop health analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoSync(!autoSync)}
            className={autoSync ? 'bg-primary/10' : ''}
          >
            {autoSync ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            Auto Sync {autoSync ? 'On' : 'Off'}
          </Button>
          
          {selectedLand && (
            <Button
              onClick={() => processSatelliteData(selectedLand)}
              disabled={processingLand === selectedLand}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              {processingLand === selectedLand ? 'Processing...' : 'Process New Data'}
            </Button>
          )}
        </div>
      </div>

      {/* Land Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Land</CardTitle>
          <CardDescription>Choose a land parcel for satellite monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lands.map((land) => (
              <Card
                key={land.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedLand === land.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedLand(land.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{land.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {land.area_acres} acres • {land.current_crop || 'No crop'}
                      </p>
                    </div>
                    {processingLand === land.id && (
                      <div className="animate-spin">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedLand && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Health Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">
                        {currentHealth ? `${currentHealth}/100` : '--'}
                      </p>
                      {healthTrend !== null && (
                        <Badge variant={healthTrend >= 0 ? 'default' : 'destructive'}>
                          {healthTrend >= 0 ? '+' : ''}{healthTrend.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    {currentHealth && (
                      <Progress value={currentHealth} className="mt-2" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Satellite className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Latest NDVI</p>
                    <p className="text-2xl font-bold">
                      {latestNDVI ? latestNDVI.toFixed(3) : '--'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ndviData.length > 0 ? new Date(ndviData[0].date).toLocaleDateString() : 'No data'}
                    </p>
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
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold">{alerts.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {alerts.filter(a => a.severity === 'critical').length} critical
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You have {alerts.length} active satellite alerts. Check the Alerts tab for details.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="visualization" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visualization">NDVI Maps</TabsTrigger>
              <TabsTrigger value="analytics">Health Analytics</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="prescription">Prescription Maps</TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="space-y-6">
              <NDVIVisualization
                landId={selectedLand}
                ndviData={ndviData}
                satelliteImagery={satelliteImagery}
                onDownload={downloadImagery}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <HealthAnalytics
                landId={selectedLand}
                healthAssessments={healthAssessments}
                ndviData={ndviData}
              />
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <SatelliteAlerts
                landId={selectedLand}
                alerts={alerts}
                onRefresh={fetchAlerts}
              />
            </TabsContent>

            <TabsContent value="prescription" className="space-y-6">
              <PrescriptionMaps
                landId={selectedLand}
                healthAssessments={healthAssessments}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SatelliteMonitoring;