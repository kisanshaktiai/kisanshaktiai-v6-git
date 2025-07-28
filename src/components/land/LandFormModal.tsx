import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Calendar, MapPin, Save } from 'lucide-react';
import { useCreateLand } from '@/hooks/useLands';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { LandCreateInput } from '@/types/land';

interface Point {
  lat: number;
  lng: number;
}

interface LandFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boundaryPoints: Point[];
  calculatedArea: number;
  centerPoint: Point | null;
  enhancedData?: any;
  onSuccess?: () => void;
}

export const LandFormModal: React.FC<LandFormModalProps> = ({
  open,
  onOpenChange,
  boundaryPoints,
  calculatedArea,
  centerPoint,
  enhancedData,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const createLandMutation = useCreateLand();

  const [formData, setFormData] = useState({
    name: '',
    survey_number: '',
    ownership_type: 'owned' as 'owned' | 'leased' | 'shared' | 'rented',
    irrigation_source: '',
    notes: '',
    soil_type: '',
    crop_pattern: '',
    photos: [] as string[]
  });

  const [timestamp] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        survey_number: '',
        ownership_type: 'owned',
        irrigation_source: '',
        notes: '',
        soil_type: '',
        crop_pattern: '',
        photos: []
      });
    }
  }, [open]);

  // Auto-suggest land name based on location
  useEffect(() => {
    if (open && centerPoint && !formData.name) {
      // You could integrate with reverse geocoding here
      // For now, use a simple pattern
      const suggestedName = `Field ${new Date().toLocaleDateString('en-IN')}`;
      setFormData(prev => ({ ...prev, name: suggestedName }));
    }
  }, [open, centerPoint, formData.name]);

  const handlePhotoCapture = () => {
    // In a real implementation, this would use Capacitor Camera
    // For now, we'll just show a placeholder
    toast({
      title: "Photo Capture",
      description: "Photo capture functionality will be implemented with camera integration.",
    });
  };

  const handleVoiceInput = (field: string) => {
    // Voice input functionality placeholder
    toast({
      title: "Voice Input",
      description: "Voice input functionality will be implemented.",
    });
  };

  const getAreaDisplay = (acres: number) => {
    const hectares = acres * 0.404686;
    const sqMeters = acres * 4046.86;
    const guntha = acres * 40; // Maharashtra unit
    
    return {
      acres: acres.toFixed(2),
      hectares: hectares.toFixed(2),
      sqMeters: sqMeters.toFixed(0),
      guntha: guntha.toFixed(1)
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Land name is required",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to add land",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validate boundary points
      if (!boundaryPoints || boundaryPoints.length < 3) {
        toast({
          title: "Invalid Boundary",
          description: "At least 3 boundary points are required.",
          variant: "destructive"
        });
        return;
      }
      
      const landData: LandCreateInput = {
        name: formData.name.trim(),
        farmer_id: user.id,
        tenant_id: tenant?.id || '',
        area_acres: calculatedArea,
        survey_number: formData.survey_number.trim() || undefined,
        ownership_type: formData.ownership_type,
        irrigation_source: formData.irrigation_source.trim() || undefined,
        // Enhanced fields from GPS tracking
        village: enhancedData?.locationContext?.village,
        taluka: enhancedData?.locationContext?.taluka,
        district: enhancedData?.locationContext?.district,
        state: enhancedData?.locationContext?.state,
        gps_accuracy_meters: enhancedData?.gpsAccuracy,
        gps_recorded_at: enhancedData?.recordedAt?.toISOString(),
        boundary_method: enhancedData?.boundaryMethod || 'manual',
        location_context: enhancedData?.locationContext ? {
          ...enhancedData.locationContext,
          totalPoints: enhancedData.totalPoints,
          recordingMethod: enhancedData.boundaryMethod
        } : {}
      };

      // Create proper GeoJSON for PostGIS (ensure closed polygon)
      const coordinates = [...boundaryPoints.map(p => [p.lng, p.lat])];
      if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
          coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
        coordinates.push([boundaryPoints[0].lng, boundaryPoints[0].lat]);
      }

      const finalLandData = {
        ...landData,
        boundary_polygon: {
          type: 'Polygon',
          coordinates: [coordinates]
        },
        center_point: centerPoint ? {
          type: 'Point',
          coordinates: [centerPoint.lng, centerPoint.lat]
        } : null
      };

      console.log('Submitting land data:', finalLandData);
      
      await createLandMutation.mutateAsync(finalLandData);
      
      toast({
        title: "Success!",
        description: `${formData.name} has been added to your lands.`,
      });
      
      onSuccess?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating land:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save land details. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const areaDisplay = getAreaDisplay(calculatedArea);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Land Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Boundary Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Boundary Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Boundary Points:</span>
                  <div className="font-medium">{boundaryPoints.length} points marked</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Recorded At:</span>
                  <div className="font-medium">{timestamp.toLocaleString('en-IN')}</div>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground text-sm">Calculated Area:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary">{areaDisplay.acres} acres</Badge>
                  <Badge variant="secondary">{areaDisplay.hectares} hectares</Badge>
                  <Badge variant="secondary">{areaDisplay.sqMeters} sq m</Badge>
                  <Badge variant="secondary">{areaDisplay.guntha} guntha</Badge>
                </div>
              </div>

              {centerPoint && (
                <div className="text-xs text-muted-foreground">
                  Location: {centerPoint.lat.toFixed(6)}, {centerPoint.lng.toFixed(6)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="required">Land Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., North Field, Main Farm"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVoiceInput('name')}
                      className="px-3"
                    >
                      🎤
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="survey_number">Gat/Survey Number</Label>
                  <Input
                    id="survey_number"
                    value={formData.survey_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, survey_number: e.target.value }))}
                    placeholder="e.g., 123/4A, Gat No. 456"
                  />
                </div>

                <div>
                  <Label htmlFor="ownership_type">Ownership Type</Label>
                  <Select
                    value={formData.ownership_type}
                    onValueChange={(value: 'owned' | 'leased' | 'shared' | 'rented') =>
                      setFormData(prev => ({ ...prev, ownership_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Owned</SelectItem>
                      <SelectItem value="leased">Leased</SelectItem>
                      <SelectItem value="shared">Shared/Partnership</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="irrigation_source">Irrigation Source</Label>
                  <Select
                    value={formData.irrigation_source}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, irrigation_source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select irrigation source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borewell">Borewell</SelectItem>
                      <SelectItem value="canal">Canal Water</SelectItem>
                      <SelectItem value="river">River Water</SelectItem>
                      <SelectItem value="rainwater">Rainwater Harvesting</SelectItem>
                      <SelectItem value="drip">Drip Irrigation</SelectItem>
                      <SelectItem value="sprinkler">Sprinkler System</SelectItem>
                      <SelectItem value="none">No Irrigation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="soil_type">Soil Type (Optional)</Label>
                  <Select
                    value={formData.soil_type}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, soil_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black_cotton">Black Cotton Soil</SelectItem>
                      <SelectItem value="red_soil">Red Soil</SelectItem>
                      <SelectItem value="alluvial">Alluvial Soil</SelectItem>
                      <SelectItem value="sandy">Sandy Soil</SelectItem>
                      <SelectItem value="clay">Clay Soil</SelectItem>
                      <SelectItem value="loamy">Loamy Soil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="crop_pattern">Main Crop Pattern (Optional)</Label>
                  <Select
                    value={formData.crop_pattern}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, crop_pattern: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kharif">Kharif (Monsoon)</SelectItem>
                      <SelectItem value="rabi">Rabi (Winter)</SelectItem>
                      <SelectItem value="zaid">Zaid (Summer)</SelectItem>
                      <SelectItem value="perennial">Perennial</SelectItem>
                      <SelectItem value="mixed">Mixed Cropping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information about this land..."
                  rows={3}
                />
              </div>

              {/* Photo Capture */}
              <div>
                <Label>Land Photos (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePhotoCapture}
                  className="w-full mt-2"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Land Photos
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Add photos to help identify your land visually
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Land'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};