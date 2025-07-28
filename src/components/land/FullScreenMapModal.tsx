import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  Trash2, 
  Save, 
  RotateCcw, 
  MapPin, 
  Satellite,
  Maximize2,
  X,
  Plus,
  Minus,
  Target,
  Square,
  Undo
} from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';

interface Point {
  lat: number;
  lng: number;
}

interface FullScreenMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoundaryComplete: (points: Point[], area: number, centerPoint: Point | null, enhancedData?: any) => void;
}

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

export const FullScreenMapModal: React.FC<FullScreenMapModalProps> = ({
  open,
  onOpenChange,
  onBoundaryComplete
}) => {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const placesServiceRef = useRef<any>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Point | null>(null);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [walkMode, setWalkMode] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationContext, setLocationContext] = useState<{
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    accuracy?: number;
  } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [boundaryMethod, setBoundaryMethod] = useState<'manual' | 'gps_walk' | 'gps_points'>('manual');
  const [showLocationLabels, setShowLocationLabels] = useState(true);

  // Load Google Maps
  const loadGoogleMaps = useCallback(async () => {
    if (window.google) {
      setMapsLoaded(true);
      return;
    }

    try {
      // Get API key from Supabase Edge Function with proper URL
      const response = await fetch(`https://qfklkkzxemsbeniyugiz.supabase.co/functions/v1/get-maps-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2xra3p4ZW1zYmVuaXl1Z2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjcxNjUsImV4cCI6MjA2ODAwMzE2NX0.dUnGp7wbwYom1FPbn_4EGf3PWjgmr8mXwL2w2SdYOh4`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2xra3p4ZW1zYmVuaXl1Z2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjcxNjUsImV4cCI6MjA2ODAwMzE2NX0.dUnGp7wbwYom1FPbn_4EGf3PWjgmr8mXwL2w2SdYOh4',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      const { apiKey } = data;
      
      if (!apiKey) {
        throw new Error('Google Maps API key not found');
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => {
        toast({
          title: "Map Loading Error",
          description: "Failed to load Google Maps. Please try again.",
          variant: "destructive"
        });
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      toast({
        title: "Configuration Error",
        description: "Google Maps API not configured. Please contact support.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 18,
      center: { lat: 20.5937, lng: 78.9629 }, // Default to India center
      mapTypeId: 'satellite',
      disableDefaultUI: true, // Clean interface
      zoomControl: false, // Custom controls
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    mapInstanceRef.current = map;
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);

    // Get current location with high accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(pos);
          map.setCenter(pos);
          map.setZoom(20);
          
          // Add current location marker
          new window.google.maps.Marker({
            position: pos,
            map: map,
            title: 'Current Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${tenant?.branding?.primary_color || '#10B981'}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 12)
            }
          });

          // Get detailed location context
          getLocationContext(pos);
          setGpsAccuracy(position.coords.accuracy);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Access",
            description: "Unable to access your location. You can still mark boundaries manually.",
            variant: "destructive"
          });
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    }

    // Click to add points
    map.addListener('click', (e: any) => {
      if (!walkMode && e.latLng) {
        setBoundaryMethod('manual');
        addBoundaryPoint({
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        });
      }
    });
  }, [tenant?.branding?.primary_color, toast, walkMode]);

  // Enhanced location context with reverse geocoding
  const getLocationContext = async (location: Point) => {
    try {
      // Use Google Maps Geocoding API for detailed location info
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ location: new window.google.maps.LatLng(location.lat, location.lng) }, (results: any[], status: any) => {
        if (status === 'OK' && results[0]) {
          const components = results[0].address_components;
          const context: any = {};
          
          components.forEach((component: any) => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_3')) {
              context.village = component.long_name;
            } else if (types.includes('administrative_area_level_2')) {
              context.taluka = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              context.district = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              context.state = component.long_name;
            }
          });
          
          setLocationContext(context);
          
          // Also search for nearby landmarks
          searchNearbyPlaces(location);
        }
      });
    } catch (error) {
      console.error('Error getting location context:', error);
    }
  };

  // Search nearby places for context with enhanced types
  const searchNearbyPlaces = (location: Point) => {
    if (!placesServiceRef.current) return;

    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: 2000,
      types: ['locality', 'sublocality', 'administrative_area_level_1', 'administrative_area_level_2', 'administrative_area_level_3']
    };

    placesServiceRef.current.nearbySearch(request, (results: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setNearbyPlaces(results.slice(0, 5));
        
        // Add labels to map if enabled
        if (showLocationLabels) {
          results.slice(0, 3).forEach((place: any, index: number) => {
            const marker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapInstanceRef.current,
              title: place.name,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="${tenant?.branding?.accent_color || '#6366F1'}" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(16, 16),
                anchor: new window.google.maps.Point(8, 16),
                labelOrigin: new window.google.maps.Point(8, -2)
              },
              label: {
                text: place.name,
                color: '#374151',
                fontSize: '12px',
                fontWeight: 'bold',
                className: 'map-label'
              }
            });
          });
        }
      }
    });
  };

  // Add boundary point with enhanced GPS tracking
  const addBoundaryPoint = (point: Point, accuracy?: number) => {
    setPoints(prev => {
      const newPoints = [...prev, point];
      
      // Add marker with GPS accuracy indication
      const markerColor = accuracy && accuracy > 10 ? '#F59E0B' : tenant?.branding?.primary_color || '#10B981';
      const marker = new window.google.maps.Marker({
        position: point,
        map: mapInstanceRef.current,
        title: `Point ${newPoints.length}${accuracy ? ` (±${accuracy.toFixed(1)}m)` : ''}`,
        label: {
          text: newPoints.length.toString(),
          color: 'white',
          fontWeight: 'bold'
        },
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${markerColor}" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="8"/>
              ${accuracy && accuracy > 10 ? '<circle cx="12" cy="12" r="4" fill="white"/>' : ''}
            </svg>
          `),
          scaledSize: new window.google.maps.Size(20, 20),
          anchor: new window.google.maps.Point(10, 10)
        }
      });
      
      // Add accuracy circle if GPS tracking
      if (accuracy && accuracy > 0) {
        const accuracyCircle = new window.google.maps.Circle({
          strokeColor: markerColor,
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: markerColor,
          fillOpacity: 0.1,
          map: mapInstanceRef.current,
          center: point,
          radius: accuracy
        });
      }
      
      markersRef.current.push(marker);
      return newPoints;
    });
  };

  // Enhanced GPS walking mode with accuracy tracking
  const startWalkMode = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Available",
        description: "Your device doesn't support GPS tracking.",
        variant: "destructive"
      });
      return;
    }

    setWalkMode(true);
    setBoundaryMethod('gps_walk');
    setPoints([]);
    clearMarkers();
    
    toast({
      title: "GPS Walking Mode",
      description: "Walk around your field boundary. Points will be recorded automatically.",
    });
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        const accuracy = position.coords.accuracy;
        setGpsAccuracy(accuracy);
        
        // Only add if moved significantly and accuracy is reasonable
        setPoints(prev => {
          if (prev.length === 0) {
            addBoundaryPoint(newPoint, accuracy);
            return [newPoint];
          }
          
          const lastPoint = prev[prev.length - 1];
          const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(lastPoint.lat, lastPoint.lng),
            new window.google.maps.LatLng(newPoint.lat, newPoint.lng)
          );
          
          // Adaptive distance threshold based on accuracy
          const minDistance = Math.max(2, accuracy * 0.5);
          
          if (distance > minDistance) {
            addBoundaryPoint(newPoint, accuracy);
            return [...prev, newPoint];
          }
          return prev;
        });
        
        // Update map center to follow user
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newPoint);
        }
      },
      (error) => {
        console.error('GPS tracking error:', error);
        setWalkMode(false);
        setBoundaryMethod('manual');
        toast({
          title: "GPS Tracking Error",
          description: "Unable to track your movement. Please ensure GPS is enabled and you have a clear sky view.",
          variant: "destructive"
        });
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 500, 
        timeout: 10000 
      }
    );
    
    setWatchId(id);

    // Auto-stop after 15 minutes with warning at 10 minutes
    setTimeout(() => {
      toast({
        title: "GPS Tracking",
        description: "GPS tracking will stop in 5 minutes. Complete your boundary soon.",
        variant: "default"
      });
    }, 600000);
    
    setTimeout(() => {
      if (id) {
        navigator.geolocation.clearWatch(id);
        setWalkMode(false);
        setBoundaryMethod('manual');
        setWatchId(null);
        toast({
          title: "GPS Tracking Stopped",
          description: "GPS tracking has been automatically stopped after 15 minutes.",
        });
      }
    }, 900000);
  };

  // Stop walk mode
  const stopWalkMode = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setWalkMode(false);
  };

  // Clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Clear boundary
  const clearBoundary = () => {
    setPoints([]);
    setCalculatedArea(0);
    clearMarkers();
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
  };

  // Update polygon when points change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || points.length < 3) {
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
      strokeWeight: 3,
      fillColor: tenant?.branding?.primary_color || '#10B981',
      fillOpacity: 0.15,
      editable: false,
      draggable: false
    });

    polygon.setMap(mapInstanceRef.current);
    polygonRef.current = polygon;

    // Calculate area
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const areaInAcres = area * 0.000247105; // Convert square meters to acres
    setCalculatedArea(areaInAcres);

    // Fit bounds to polygon
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(point => bounds.extend(point));
    mapInstanceRef.current.fitBounds(bounds);
  }, [points, tenant?.branding?.primary_color]);

  // Load maps when modal opens
  useEffect(() => {
    if (open && !mapsLoaded) {
      loadGoogleMaps();
    }
  }, [open, mapsLoaded, loadGoogleMaps]);

  // Initialize map when loaded
  useEffect(() => {
    if (open && mapsLoaded) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [open, mapsLoaded, initializeMap]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      setPoints([]);
      setCalculatedArea(0);
      setWalkMode(false);
      setNearbyPlaces([]);
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      clearMarkers();
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
    }
  }, [open, watchId]);

  const handleSave = () => {
    if (points.length < 3) {
      toast({
        title: "Insufficient Points",
        description: "Please mark at least 3 boundary points.",
        variant: "destructive"
      });
      return;
    }

    // Enhanced data for land creation
    const enhancedData = {
      points,
      area: calculatedArea,
      centerPoint: currentLocation,
      locationContext,
      gpsAccuracy,
      boundaryMethod,
      recordedAt: new Date(),
      totalPoints: points.length
    };

    onBoundaryComplete(points, calculatedArea, currentLocation, enhancedData);
    onOpenChange(false);
  };

  // Area display in multiple units
  const getAreaDisplay = (acres: number) => {
    const hectares = acres * 0.404686;
    const sqMeters = acres * 4046.86;
    const guntha = acres * 40; // 1 acre = 40 guntha (Maharashtra unit)
    
    return {
      acres: acres.toFixed(2),
      hectares: hectares.toFixed(2),
      sqMeters: sqMeters.toFixed(0),
      guntha: guntha.toFixed(1)
    };
  };

  const areaDisplay = getAreaDisplay(calculatedArea);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-card/90 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-2">
                <Satellite className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Draw Boundary</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 mt-[64px]">
            {mapsLoaded ? (
              <div ref={mapRef} className="w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading satellite view...</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Controls */}
          <div className="absolute top-[80px] left-4 flex gap-2 z-20">
            <Button
              variant="outline"
              size="icon"
              onClick={() => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() || 15) + 1)}
              className="h-10 w-10 bg-card/80 backdrop-blur-sm border-border/50"
              title="Zoom In"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() || 15) - 1)}
              className="h-10 w-10 bg-card/80 backdrop-blur-sm border-border/50"
              title="Zoom Out"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (currentLocation) {
                  mapInstanceRef.current?.setCenter(currentLocation);
                  mapInstanceRef.current?.setZoom(18);
                }
              }}
              className="h-10 w-10 bg-card/80 backdrop-blur-sm border-border/50"
              title="My Location"
            >
              <Target className="h-4 w-4" />
            </Button>
          </div>

          {/* Left Control Buttons */}
          <div className="absolute bottom-20 left-4 flex flex-col gap-2 z-20">
            <Button
              variant={walkMode ? "default" : "outline"}
              size="icon"
              onClick={walkMode ? stopWalkMode : startWalkMode}
              className="h-12 w-12 bg-card/80 backdrop-blur-sm border-border/50"
              title={walkMode ? "Stop Walking" : "Walk Boundary"}
            >
              {walkMode ? <Square className="h-5 w-5" /> : <Navigation className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={clearBoundary}
              disabled={points.length === 0}
              className="h-12 w-12 bg-card/80 backdrop-blur-sm border-border/50"
              title="Clear All"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (points.length > 0) {
                  setPoints(points.slice(0, -1));
                }
              }}
              disabled={points.length === 0}
              className="h-12 w-12 bg-card/80 backdrop-blur-sm border-border/50"
              title="Undo Last"
            >
              <Undo className="h-5 w-5" />
            </Button>
          </div>

          {/* Compact Bottom Info Card */}
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg p-3 min-w-[140px] z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Points</span>
              <span className="text-sm font-semibold">{points.length}</span>
            </div>
            
            {calculatedArea > 0 && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">Area</span>
                <span className="text-sm font-semibold">{getAreaDisplay(calculatedArea).acres} ac</span>
              </div>
            )}
            
            <Button
              onClick={handleSave}
              disabled={points.length < 3}
              size="sm"
              className="w-full h-8"
            >
              <Save className="mr-1 h-3 w-3" />
              Save
            </Button>
          </div>

          {/* Legacy Controls - Hidden */}
          <div className="absolute bottom-4 left-4 right-4 z-10 hidden">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                {/* Area Display */}
                {calculatedArea > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Calculated Area</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <Badge variant="secondary">
                        {areaDisplay.acres} acres
                      </Badge>
                      <Badge variant="secondary">
                        {areaDisplay.hectares} hectares
                      </Badge>
                      <Badge variant="secondary">
                        {areaDisplay.sqMeters} sq m
                      </Badge>
                      <Badge variant="secondary">
                        {areaDisplay.guntha} guntha
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Points Counter */}
                <div className="mb-4 text-sm">
                  <span className="font-medium">Boundary Points: </span>
                  <span className="text-primary">{points.length}</span>
                  {points.length > 0 && (
                    <span className="text-muted-foreground">
                      {points.length < 3 ? ` (need ${3 - points.length} more)` : ' (ready to save)'}
                    </span>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={walkMode ? "destructive" : "default"}
                    size="sm"
                    onClick={walkMode ? stopWalkMode : startWalkMode}
                    disabled={!navigator.geolocation}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {walkMode ? 'Stop Walking' : 'Walk Boundary'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearBoundary}
                    disabled={points.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (points.length > 0) {
                        setPoints(prev => prev.slice(0, -1));
                        if (markersRef.current.length > 0) {
                          const lastMarker = markersRef.current.pop();
                          lastMarker?.setMap(null);
                        }
                      }
                    }}
                    disabled={points.length === 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Undo
                  </Button>

                  <div className="flex-1"></div>

                  <Button
                    onClick={handleSave}
                    disabled={points.length < 3}
                    className="min-w-[100px]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Boundary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};