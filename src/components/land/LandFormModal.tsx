import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Calendar, MapPin, Save, Upload, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { LandCreateInput } from '@/types/land';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

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
      setCapturedPhotos([]);
      generateUniqueLandName();
    }
  }, [open]);

  // Generate unique land name
  const generateUniqueLandName = async () => {
    if (!centerPoint || !tenant?.id || !user?.id) return;
    
    setIsGeneratingName(true);
    try {
      const { data } = await supabase.functions.invoke('land-operations', {
        body: {
          action: 'GENERATE_NAME',
          latitude: centerPoint.lat,
          longitude: centerPoint.lng,
          tenantId: tenant.id
        }
      });
      
      if (data?.success && data?.name) {
        setFormData(prev => ({ ...prev, name: data.name }));
      }
    } catch (error) {
      console.error('Error generating name:', error);
      // Fallback to simple name
      const fallbackName = `Field ${new Date().toLocaleDateString('en-IN')}`;
      setFormData(prev => ({ ...prev, name: fallbackName }));
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handlePhotoCapture = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024
      });

      if (image.dataUrl) {
        setCapturedPhotos(prev => [...prev, image.dataUrl!]);
        toast({
          title: "Photo Captured",
          description: "Photo captured successfully!",
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to capture photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCapturedPhotos(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      toast({
        title: "Photos Added",
        description: `${files.length} photo(s) added successfully!`,
      });
    }
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
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
    
    // Enhanced validation
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

    if (!tenant?.id) {
      toast({
        title: "Tenant Error",
        description: "No tenant selected. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    // Validate boundary points
    if (!boundaryPoints || boundaryPoints.length < 3) {
      toast({
        title: "Invalid Boundary",
        description: "At least 3 boundary points are required to create a valid land parcel.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create proper GeoJSON for PostGIS (ensure closed polygon)
      const coordinates = [...boundaryPoints.map(p => [p.lng, p.lat])];
      if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
          coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
        coordinates.push([boundaryPoints[0].lng, boundaryPoints[0].lat]);
      }

      // Prepare land data with correct field mapping
      const landData = {
        name: formData.name.trim(),
        tenant_id: tenant.id,
        area_acres: calculatedArea,
        survey_number: formData.survey_number.trim() || null,
        ownership_type: formData.ownership_type,
        irrigation_source: formData.irrigation_source.trim() || null,
        soil_type: formData.soil_type || null,
        
        // Enhanced fields from GPS tracking
        village: enhancedData?.locationContext?.village || null,
        taluka: enhancedData?.locationContext?.taluka || null,
        district: enhancedData?.locationContext?.district || null,
        state: enhancedData?.locationContext?.state || null,
        gps_accuracy_meters: enhancedData?.gpsAccuracy || null,
        gps_recorded_at: enhancedData?.recordedAt?.toISOString() || new Date().toISOString(),
        boundary_method: enhancedData?.boundaryMethod || 'manual',
        
        // GeoJSON data
        boundary_polygon: {
          type: 'Polygon',
          coordinates: [coordinates]
        },
        center_point: centerPoint ? {
          type: 'Point',
          coordinates: [centerPoint.lng, centerPoint.lat]
        } : null,
        
        // Context data including photos
        location_context: {
          ...enhancedData?.locationContext,
          totalPoints: boundaryPoints.length,
          recordingMethod: enhancedData?.boundaryMethod || 'manual',
          timestamp: new Date().toISOString(),
          photos: capturedPhotos.length
        }
      };

      console.log('Submitting land data via edge function:', landData);
      
      // Create land first
      const { data: result, error } = await supabase.functions.invoke('land-operations', {
        body: {
          action: 'CREATE',
          ...landData
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create land');
      }

      if (!result?.success) {
        console.error('Land creation failed:', result);
        throw new Error(result?.error || 'Failed to create land');
      }

      const createdLand = result.data;
      console.log('Land created successfully:', createdLand);

      // Upload photos after land creation with actual landId
      const uploadedPhotos: string[] = [];
      if (capturedPhotos.length > 0 && createdLand?.id) {
        for (let i = 0; i < capturedPhotos.length; i++) {
          try {
            const base64Data = capturedPhotos[i].split(',')[1];
            const fileName = `land_photo_${Date.now()}_${i}.jpg`;
            
            const { data: photoResult } = await supabase.functions.invoke('land-operations', {
              body: {
                action: 'UPLOAD_PHOTO',
                landId: createdLand.id,
                photoData: base64Data,
                fileName
              }
            });
            
            if (photoResult?.success) {
              uploadedPhotos.push(photoResult.data.url);
              console.log('Photo uploaded successfully:', photoResult.data.url);
            }
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
            // Continue with land creation even if photo upload fails
          }
        }
      }

      // Update land with photo URLs if any were uploaded
      if (uploadedPhotos.length > 0 && createdLand?.id) {
        try {
          await supabase.functions.invoke('land-operations', {
            body: {
              action: 'UPDATE',
              landId: createdLand.id,
              updates: {
                location_context: {
                  ...landData.location_context,
                  photoUrls: uploadedPhotos
                }
              }
            }
          });
        } catch (updateError) {
          console.warn('Failed to update land with photo URLs:', updateError);
        }
      }
      
      toast({
        title: "Success!",
        description: `${formData.name} has been successfully added to your lands.`,
      });
      
      // Reset form state
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
      setCapturedPhotos([]);
      
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
                      disabled={isGeneratingName}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateUniqueLandName}
                      disabled={isGeneratingName}
                      className="px-3"
                    >
                      {isGeneratingName ? '⏳' : '🔄'}
                    </Button>
                  </div>
                  {isGeneratingName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Generating unique name...
                    </p>
                  )}
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePhotoCapture}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                
                {/* Photo Preview */}
                {capturedPhotos.length > 0 && (
                  <div className="mt-3">
                    <div className="grid grid-cols-3 gap-2">
                      {capturedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={photo} 
                            alt={`Land photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {capturedPhotos.length} photo(s) captured
                    </p>
                  </div>
                )}
                
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