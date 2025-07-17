import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Map, Plus, Download, Calendar, DollarSign, Droplets, Sprout } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrescriptionMapsProps {
  landId: string;
  healthAssessments: any[];
}

const PrescriptionMaps: React.FC<PrescriptionMapsProps> = ({
  landId,
  healthAssessments
}) => {
  const [prescriptionMaps, setPrescriptionMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMap, setNewMap] = useState({
    map_type: 'fertilizer',
    crop_name: '',
    growth_stage: '',
    zones: [],
    application_method: '',
    estimated_cost: 0
  });

  useEffect(() => {
    fetchPrescriptionMaps();
  }, [landId]);

  const fetchPrescriptionMaps = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('prescription_maps')
      .select('*')
      .eq('land_id', landId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching prescription maps:', error);
      toast.error('Failed to fetch prescription maps');
    } else {
      setPrescriptionMaps(data || []);
    }
    
    setLoading(false);
  };

  const generatePrescriptionMap = async () => {
    if (!healthAssessments.length) {
      toast.error('No health assessment data available for map generation');
      return;
    }

    const latestAssessment = healthAssessments[0];
    
    // Generate zones based on health assessment
    const zones = generateZonesFromHealthData(latestAssessment);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current tenant from user tenants
      const { data: userTenants } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!userTenants) return;

      const { data, error } = await supabase
        .from('prescription_maps')
        .insert({
          land_id: landId,
          farmer_id: user.id,
          tenant_id: userTenants.tenant_id,
          map_type: newMap.map_type,
          created_date: new Date().toISOString().split('T')[0],
          zones: zones,
          crop_name: newMap.crop_name,
          growth_stage: newMap.growth_stage,
          map_data: {
            health_score: latestAssessment.overall_health_score,
            ndvi_avg: latestAssessment.ndvi_avg,
            generation_method: 'satellite_based',
            recommendations: latestAssessment.recommendations
          },
          application_method: newMap.application_method,
          estimated_cost: newMap.estimated_cost,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Prescription map generated successfully');
      setIsCreateModalOpen(false);
      fetchPrescriptionMaps();
      resetNewMap();
    } catch (error) {
      console.error('Error generating prescription map:', error);
      toast.error('Failed to generate prescription map');
    }
  };

  const generateZonesFromHealthData = (assessment: any) => {
    const zones = [];
    
    // High performance zone
    zones.push({
      id: 'zone_1',
      name: 'High Performance Zone',
      area_percentage: 100 - (assessment.problem_areas?.reduce((sum: number, area: any) => sum + (area.area_percentage || 0), 0) || 0),
      health_score: Math.max(70, assessment.overall_health_score + 10),
      application_rate: getApplicationRate(newMap.map_type, 'standard'),
      color: '#10b981',
      recommendations: ['Maintain current management', 'Monitor for optimal harvest timing']
    });

    // Problem zones
    if (assessment.problem_areas) {
      assessment.problem_areas.forEach((area: any, index: number) => {
        zones.push({
          id: `problem_zone_${index + 1}`,
          name: `${area.type?.replace('_', ' ')} Zone`,
          area_percentage: area.area_percentage,
          health_score: area.severity === 'high' ? 20 : area.severity === 'medium' ? 40 : 60,
          application_rate: getApplicationRate(newMap.map_type, area.severity),
          color: area.severity === 'high' ? '#ef4444' : area.severity === 'medium' ? '#f59e0b' : '#84cc16',
          recommendations: getZoneRecommendations(area.type, area.severity, newMap.map_type)
        });
      });
    }

    return zones;
  };

  const getApplicationRate = (mapType: string, severity: string) => {
    const rates = {
      fertilizer: {
        standard: 50,
        low: 40,
        medium: 65,
        high: 80
      },
      irrigation: {
        standard: 25,
        low: 20,
        medium: 35,
        high: 45
      },
      pesticide: {
        standard: 2,
        low: 1.5,
        medium: 2.5,
        high: 3.5
      }
    };

    return rates[mapType as keyof typeof rates]?.[severity as keyof typeof rates.fertilizer] || 50;
  };

  const getZoneRecommendations = (problemType: string, severity: string, mapType: string) => {
    const recommendations: Record<string, string[]> = {
      low_vigor: [
        'Increase fertilizer application',
        'Check soil pH levels',
        'Consider soil amendments'
      ],
      water_stress: [
        'Increase irrigation frequency',
        'Check irrigation system efficiency',
        'Consider drought-resistant varieties'
      ],
      nutrient_deficiency: [
        'Apply balanced NPK fertilizer',
        'Conduct soil test',
        'Consider micronutrient supplements'
      ]
    };

    return recommendations[problemType] || ['Monitor closely', 'Apply standard treatment'];
  };

  const resetNewMap = () => {
    setNewMap({
      map_type: 'fertilizer',
      crop_name: '',
      growth_stage: '',
      zones: [],
      application_method: '',
      estimated_cost: 0
    });
  };

  const getMapTypeIcon = (type: string) => {
    switch (type) {
      case 'fertilizer':
        return <Sprout className="h-5 w-5 text-green-600" />;
      case 'irrigation':
        return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'pesticide':
        return <Sprout className="h-5 w-5 text-orange-600" />;
      default:
        return <Map className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'applied':
        return 'default';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const downloadMap = (map: any) => {
    // Generate CSV data
    const csvData = [
      ['Zone ID', 'Zone Name', 'Area %', 'Health Score', 'Application Rate', 'Recommendations'],
      ...map.zones.map((zone: any) => [
        zone.id,
        zone.name,
        zone.area_percentage,
        zone.health_score,
        zone.application_rate,
        zone.recommendations.join('; ')
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription_map_${map.created_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-6 w-6" />
                Prescription Maps
              </CardTitle>
              <CardDescription>
                Variable rate application maps based on satellite health analysis
              </CardDescription>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Generate Map
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate Prescription Map</DialogTitle>
                  <DialogDescription>
                    Create a variable rate application map based on satellite health data
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="map_type">Map Type</Label>
                    <Select 
                      value={newMap.map_type} 
                      onValueChange={(value) => setNewMap({...newMap, map_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fertilizer">Fertilizer Application</SelectItem>
                        <SelectItem value="irrigation">Irrigation Schedule</SelectItem>
                        <SelectItem value="pesticide">Pesticide Application</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="crop_name">Crop Name</Label>
                    <Input
                      id="crop_name"
                      value={newMap.crop_name}
                      onChange={(e) => setNewMap({...newMap, crop_name: e.target.value})}
                      placeholder="e.g., Wheat, Rice, Cotton"
                    />
                  </div>

                  <div>
                    <Label htmlFor="growth_stage">Growth Stage</Label>
                    <Select 
                      value={newMap.growth_stage} 
                      onValueChange={(value) => setNewMap({...newMap, growth_stage: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select growth stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="germination">Germination</SelectItem>
                        <SelectItem value="vegetative">Vegetative</SelectItem>
                        <SelectItem value="flowering">Flowering</SelectItem>
                        <SelectItem value="grain_filling">Grain Filling</SelectItem>
                        <SelectItem value="maturity">Maturity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="application_method">Application Method</Label>
                    <Input
                      id="application_method"
                      value={newMap.application_method}
                      onChange={(e) => setNewMap({...newMap, application_method: e.target.value})}
                      placeholder="e.g., Broadcast, Foliar spray"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimated_cost">Estimated Cost (₹)</Label>
                    <Input
                      id="estimated_cost"
                      type="number"
                      value={newMap.estimated_cost}
                      onChange={(e) => setNewMap({...newMap, estimated_cost: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={generatePrescriptionMap}
                      disabled={!newMap.crop_name || !newMap.growth_stage}
                      className="flex-1"
                    >
                      Generate Map
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Maps List */}
      {prescriptionMaps.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Prescription Maps</h3>
            <p className="text-muted-foreground mb-4">
              Generate variable rate application maps based on satellite health analysis
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={healthAssessments.length === 0}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Generate First Map
            </Button>
            {healthAssessments.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Health assessment data required for map generation
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {prescriptionMaps.map((map) => (
            <Card key={map.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMapTypeIcon(map.map_type)}
                    <div>
                      <CardTitle className="capitalize">
                        {map.map_type.replace('_', ' ')} Map
                      </CardTitle>
                      <CardDescription>
                        {map.crop_name} • {map.growth_stage}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(map.status)}>
                    {map.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Map Preview */}
                <div className="bg-gray-100 rounded-lg p-4 h-32 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <Map className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Zone Map Preview</p>
                    <p className="text-xs">{map.zones?.length || 0} zones</p>
                  </div>
                </div>

                {/* Map Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div>{new Date(map.created_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Area:</span>
                    <div>{map.total_area_acres || '--'} acres</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Method:</span>
                    <div>{map.application_method || '--'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <div>₹{map.estimated_cost?.toLocaleString() || '--'}</div>
                  </div>
                </div>

                {/* Zone Summary */}
                {map.zones && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Management Zones:</p>
                    <div className="space-y-1">
                      {map.zones.slice(0, 3).map((zone: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: zone.color }}
                            ></div>
                            <span>{zone.name}</span>
                          </div>
                          <span>{zone.area_percentage?.toFixed(1)}%</span>
                        </div>
                      ))}
                      {map.zones.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{map.zones.length - 3} more zones
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadMap(map)}
                    className="gap-2 flex-1"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {map.status === 'draft' && (
                    <Button size="sm" variant="outline" className="flex-1">
                      Approve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionMaps;