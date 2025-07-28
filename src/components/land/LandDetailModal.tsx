import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, Droplets, Activity, TrendingUp, Calendar, 
  FileText, AlertTriangle, Edit3, Trash2, TestTube
} from 'lucide-react';
import { LandWithDetails } from '@/types/land';
import { useTenant } from '@/hooks/useTenant';
import { useDeleteLand } from '@/hooks/useLands';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SoilDataModal } from './SoilDataModal';

interface LandDetailModalProps {
  land: LandWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (land: LandWithDetails) => void;
}

export const LandDetailModal: React.FC<LandDetailModalProps> = ({
  land,
  open,
  onOpenChange,
  onEdit
}) => {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const deleteLandMutation = useDeleteLand();
  const mapRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSoilData, setShowSoilData] = useState(false);

  // Initialize map with land boundary
  useEffect(() => {
    if (!open || !land || !mapRef.current) return;

    const initMap = () => {
      const centerPoint = land.center_point as any;
      const center = centerPoint?.coordinates 
        ? { lat: centerPoint.coordinates[1], lng: centerPoint.coordinates[0] }
        : { lat: 20.5937, lng: 78.9629 };

      const map = new window.google.maps.Map(mapRef.current!, {
        zoom: 16,
        center,
        mapTypeId: 'satellite'
      });

      // Draw boundary if available
      const boundaryPolygon = land.boundary_polygon as any;
      if (boundaryPolygon?.coordinates?.[0]) {
        const path = boundaryPolygon.coordinates[0].map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }));

        new window.google.maps.Polygon({
          paths: path,
          strokeColor: tenant?.branding?.primary_color || '#10B981',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: tenant?.branding?.primary_color || '#10B981',
          fillOpacity: 0.2,
          map
        });

        // Fit bounds to polygon
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((point: any) => bounds.extend(point));
        map.fitBounds(bounds);
      }

      // Add center marker
      if (centerPoint?.coordinates) {
        new window.google.maps.Marker({
          position: center,
          map,
          title: land.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${tenant?.branding?.primary_color || '#10B981'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24)
          }
        });
      }
    };

    if (window.google) {
      initMap();
    }
  }, [open, land, tenant?.branding?.primary_color]);

  const getHealthColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  };

  const handleDelete = async () => {
    if (!land) return;
    
    try {
      await deleteLandMutation.mutateAsync(land.id);
      toast({
        title: "Success",
        description: "Land deleted successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete land",
        variant: "destructive"
      });
    }
  };

  if (!land) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{land.name}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit?.(land)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSoilData(true)}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Soil Data
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="soil">Soil Health</TabsTrigger>
            <TabsTrigger value="crops">Crops</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Land Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Area</span>
                    <div className="font-medium">{land.area_acres.toFixed(2)} acres</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Ownership</span>
                    <div className="font-medium capitalize">{land.ownership_type}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Survey Number</span>
                    <div className="font-medium">{land.survey_number || 'Not set'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Irrigation</span>
                    <div className="font-medium">{land.irrigation_source || 'Not specified'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Card */}
            <Card>
              <CardHeader>
                <CardTitle>Land Boundary</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="w-full h-64 rounded-lg border" />
              </CardContent>
            </Card>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Health Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getHealthColor(land.health_score)}`}>
                      {land.health_score ? land.health_score.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">{getHealthLabel(land.health_score)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Crop */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Current Crop</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {land.current_crop ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-lg">
                        {land.current_crop.crop_name}
                      </Badge>
                      {land.current_crop.variety && (
                        <div className="text-sm text-gray-600">
                          Variety: {land.current_crop.variety}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        Stage: {land.current_crop.growth_stage || 'Not specified'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No active crop</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="soil" className="space-y-4">
            {land.soil_health ? (
              <Card>
                <CardHeader>
                  <CardTitle>Soil Analysis Report</CardTitle>
                  <p className="text-sm text-gray-600">
                    Last tested: {land.soil_health.test_date 
                      ? format(new Date(land.soil_health.test_date), 'MMM dd, yyyy')
                      : 'Not specified'
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {land.soil_health.ph_level || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">pH Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {land.soil_health.organic_carbon || 'N/A'}%
                      </div>
                      <div className="text-sm text-gray-600">Organic Carbon</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg">
                        {land.soil_health.nitrogen_level || 'N/A'}
                      </Badge>
                      <div className="text-sm text-gray-600">Nitrogen</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg">
                        {land.soil_health.phosphorus_level || 'N/A'}
                      </Badge>
                      <div className="text-sm text-gray-600">Phosphorus</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg">
                        {land.soil_health.potassium_level || 'N/A'}
                      </Badge>
                      <div className="text-sm text-gray-600">Potassium</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        {land.soil_health.soil_type || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Soil Type</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Soil Data Available
                  </h3>
                  <p className="text-gray-600">
                    Soil testing data is not available for this land.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="crops" className="space-y-4">
            {/* Crop History and Management would go here */}
            <Card>
              <CardHeader>
                <CardTitle>Crop History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-center py-8">
                  Crop history will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            {land.recent_activities && land.recent_activities.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {land.recent_activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <div className="font-medium capitalize">{activity.activity_type}</div>
                          <div className="text-sm text-gray-600">{activity.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {format(new Date(activity.activity_date), 'MMM dd')}
                          </div>
                          {activity.cost && (
                            <div className="text-xs text-gray-600">₹{activity.cost}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Activities Recorded
                  </h3>
                  <p className="text-gray-600">
                    Start logging your farming activities to track progress.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Generated Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-center py-8">
                  Report generation feature coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Delete Land</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Are you sure you want to delete "{land.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteLandMutation.isPending}
                  >
                    {deleteLandMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Soil Data Modal */}
        <SoilDataModal
          open={showSoilData}
          onOpenChange={setShowSoilData}
          land={land}
        />
      </DialogContent>
    </Dialog>
  );
};