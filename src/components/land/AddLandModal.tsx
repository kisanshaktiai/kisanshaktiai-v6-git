import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Plus, Trash2 } from 'lucide-react';
import { useCreateLand } from '@/hooks/useLands';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { LandCreateInput } from '@/types/land';

interface AddLandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Point {
  lat: number;
  lng: number;
}

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

const google = (window as any).google;

export const AddLandModal: React.FC<AddLandModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const createLandMutation = useCreateLand();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    survey_number: '',
    ownership_type: 'owned' as 'owned' | 'leased' | 'shared' | 'rented',
    irrigation_source: '',
    notes: ''
  });

  const [points, setPoints] = useState<Point[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Point | null>(null);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [walkMode, setWalkMode] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!open || !mapRef.current) return;

    const initMap = () => {
      const map = new window.google.maps.Map(mapRef.current!, {
        zoom: 16,
        center: { lat: 20.5937, lng: 78.9629 }, // Default to India center
        mapTypeId: 'satellite'
      });

      mapInstanceRef.current = map;

      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(pos);
            map.setCenter(pos);
            
            // Add current location marker
            new window.google.maps.Marker({
              position: pos,
              map: map,
              title: 'Current Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${tenant?.branding?.primary_color || '#10B981'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20)
              }
            });
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }

      // Click to add points
      map.addListener('click', (e: any) => {
        if (!walkMode && e.latLng) {
          const newPoint = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          };
          setPoints(prev => [...prev, newPoint]);
        }
      });
    };

    if (window.google) {
      initMap();
    } else {
      // Load Google Maps script (using a demo key for now)
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_KEY&libraries=geometry`;
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
    };
  }, [open, walkMode, tenant?.branding?.primary_color]);

  // Update polygon when points change
  useEffect(() => {
    if (!mapInstanceRef.current || points.length < 3) {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
      setCalculatedArea(0);
      return;
    }

    // Remove existing polygon
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    // Create new polygon
    const polygon = new window.google.maps.Polygon({
      paths: points,
      strokeColor: tenant?.branding?.primary_color || '#10B981',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: tenant?.branding?.primary_color || '#10B981',
      fillOpacity: 0.2
    });

    polygon.setMap(mapInstanceRef.current);
    polygonRef.current = polygon;

    // Calculate area
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const areaInAcres = area * 0.000247105; // Convert square meters to acres
    setCalculatedArea(areaInAcres);
  }, [points, tenant?.branding?.primary_color]);

  const startWalkMode = () => {
    setWalkMode(true);
    setPoints([]);
    
    const watchId = navigator.geolocation?.watchPosition(
      (position) => {
        const newPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setPoints(prev => [...prev, newPoint]);
      },
      (error) => {
        console.error('Error watching position:', error);
        toast({
          title: "Location Error",
          description: "Unable to track your location. Please ensure GPS is enabled.",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    // Auto-stop after 5 minutes
    setTimeout(() => {
      if (watchId) navigator.geolocation?.clearWatch(watchId);
      setWalkMode(false);
    }, 300000);
  };

  const clearBoundary = () => {
    setPoints([]);
    setCalculatedArea(0);
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

    if (points.length < 3) {
      toast({
        title: "Validation Error", 
        description: "Please mark at least 3 boundary points",
        variant: "destructive"
      });
      return;
    }

    try {
      const landData: LandCreateInput = {
        name: formData.name,
        farmer_id: '', // Will be set by RLS policy
        tenant_id: tenant?.id || '',
        area_acres: calculatedArea,
        survey_number: formData.survey_number || undefined,
        boundary_polygon: {
          type: 'Polygon',
          coordinates: [[...points.map(p => [p.lng, p.lat]), [points[0].lng, points[0].lat]]]
        },
        center_point: currentLocation ? {
          type: 'Point',
          coordinates: [currentLocation.lng, currentLocation.lat]
        } : undefined,
        ownership_type: formData.ownership_type,
        irrigation_source: formData.irrigation_source || undefined
      };

      await createLandMutation.mutateAsync(landData);
      
      toast({
        title: "Success",
        description: "Land added successfully",
      });
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        survey_number: '',
        ownership_type: 'owned',
        irrigation_source: '',
        notes: ''
      });
      setPoints([]);
      setCalculatedArea(0);
    } catch (error) {
      console.error('Error creating land:', error);
      toast({
        title: "Error",
        description: "Failed to add land. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Land</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Land Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., North Field"
                required
              />
            </div>
            <div>
              <Label htmlFor="survey_number">Survey Number</Label>
              <Input
                id="survey_number"
                value={formData.survey_number}
                onChange={(e) => setFormData(prev => ({ ...prev, survey_number: e.target.value }))}
                placeholder="e.g., 123/4A"
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
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="irrigation_source">Irrigation Source</Label>
              <Input
                id="irrigation_source"
                value={formData.irrigation_source}
                onChange={(e) => setFormData(prev => ({ ...prev, irrigation_source: e.target.value }))}
                placeholder="e.g., Borewell, Canal"
              />
            </div>
          </div>

          {/* Map for Boundary Marking */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Mark Land Boundary</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startWalkMode}
                    disabled={walkMode}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {walkMode ? 'Walking...' : 'Walk Boundary'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearBoundary}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <div ref={mapRef} className="w-full h-80 rounded-lg border" />

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Boundary Points:</span>
                  <div className="font-medium">{points.length} points</div>
                </div>
                <div>
                  <span className="text-gray-600">Calculated Area:</span>
                  <div className="font-medium">{calculatedArea.toFixed(2)} acres</div>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {walkMode 
                  ? 'Walk around your land boundary. GPS will automatically track points.'
                  : 'Click on the map to mark boundary points, or use "Walk Boundary" for GPS tracking.'
                }
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createLandMutation.isPending || points.length < 3}
            >
              {createLandMutation.isPending ? 'Adding...' : 'Add Land'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};