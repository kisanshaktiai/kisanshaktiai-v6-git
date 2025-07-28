import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Droplets, 
  Activity, 
  TrendingUp, 
  TestTube, 
  Satellite, 
  WifiOff, 
  Wifi, 
  Eye, 
  MoreVertical,
  Mountain,
  Leaf,
  Camera,
  FlaskConical
} from 'lucide-react';
import { LandWithDetails } from '@/types/land';
import { useTenant } from '@/hooks/useTenant';
import { LandWeatherCard } from '@/components/weather/LandWeatherCard';
import { LandErrorBoundary } from '@/components/common/LandErrorBoundary';

interface LandCardProps {
  land: LandWithDetails;
  onSelect?: (land: LandWithDetails) => void;
  onEdit?: (land: LandWithDetails) => void;
  selected?: boolean;
  isOffline?: boolean;
  showWeather?: boolean;
}

export const LandCard: React.FC<LandCardProps> = ({ 
  land, 
  onSelect, 
  onEdit, 
  selected = false,
  isOffline = false,
  showWeather = true
}) => {
  const { tenant } = useTenant();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Generate enhanced map thumbnail
  useEffect(() => {
    if (!mapRef.current || mapLoaded || (!land.boundary_polygon && !land.boundary_polygon_old)) return;

    const loadStaticMap = async () => {
      try {
        const polygonData = land.boundary_polygon_old || land.boundary_polygon;
        if (polygonData && typeof polygonData === 'object') {
          const polygon = polygonData as any;
          if (polygon.coordinates && polygon.coordinates[0]) {
            const coords = polygon.coordinates[0];
            const centerLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
            const centerLng = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length;
            
            // Create enhanced SVG map with better styling
            const svg = `
              <svg width="100%" height="100%" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="landGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:hsl(var(--primary));stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:hsl(var(--primary));stop-opacity:0.1" />
                  </radialGradient>
                  <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:hsl(var(--primary));stop-opacity:0.8" />
                    <stop offset="100%" style="stop-color:hsl(var(--accent));stop-opacity:0.6" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#landGradient)"/>
                <polygon 
                  points="15,25 85,15 105,35 95,65 25,70 10,45" 
                  fill="url(#landGradient)" 
                  stroke="url(#borderGradient)" 
                  stroke-width="2"
                  opacity="0.8"
                />
                <circle cx="60" cy="40" r="3" fill="hsl(var(--primary))" opacity="0.8"/>
                <text x="60" y="52" text-anchor="middle" font-size="8" fill="hsl(var(--primary))" opacity="0.7">
                  ${land.area_acres.toFixed(1)}ac
                </text>
              </svg>
            `;
            
            if (mapRef.current) {
              mapRef.current.innerHTML = svg;
              setMapLoaded(true);
            }
          }
        }
      } catch (error) {
        console.error('Map thumbnail error:', error);
        setMapLoaded(true);
      }
    };

    loadStaticMap();
  }, [land.boundary_polygon, land.boundary_polygon_old, land.area_acres]);

  // Enhanced health score rendering
  const getHealthColor = (score?: number): string => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 4) return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    if (score >= 3) return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
  };

  const getHealthLabel = (score?: number): string => {
    if (!score) return 'Unknown';
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <LandErrorBoundary>
      <Card 
        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 ${
          selected 
            ? 'border-primary shadow-lg ring-2 ring-primary/20' 
            : 'border-border hover:border-primary/50'
        } ${onSelect ? 'cursor-pointer' : ''}`}
        onClick={() => onSelect?.(land)}
      >
        {/* Enhanced Header with Professional Styling */}
        <div className="relative h-48 mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-accent/15 border border-primary/20">
          {mapLoaded ? (
            <div 
              ref={mapRef}
              className="absolute inset-0 flex items-center justify-center"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-primary">
                <MapPin className="w-12 h-12" />
              </div>
            </div>
          )}
          
          {/* Enhanced Area Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/95 border border-primary/20 text-primary shadow-lg backdrop-blur-sm">
              <Mountain className="w-3 h-3 mr-1" />
              {land.area_acres.toFixed(1)} acres
            </Badge>
          </div>
          
          {/* Enhanced Health Score Badge */}
          {land.health_score && (
            <div className="absolute top-3 right-3">
              <Badge 
                variant="secondary" 
                className={`${getHealthColor(land.health_score)} shadow-lg backdrop-blur-sm border border-background/20`}
              >
                <Leaf className="w-3 h-3 mr-1" />
                {getHealthLabel(land.health_score)}
              </Badge>
            </div>
          )}

          {/* Status Indicators */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            {(land.location_context as any)?.photoUrls?.length > 0 && (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs">
                <Camera className="w-3 h-3 mr-1" />
                {(land.location_context as any).photoUrls.length}
              </Badge>
            )}
            {isOffline ? (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs text-orange-600">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs text-green-600">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
            )}
          </div>
        </div>

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-xl leading-tight text-foreground">
                {land.name}
              </h3>
              {land.survey_number && (
                <p className="text-sm text-muted-foreground font-medium">
                  Survey: {land.survey_number}
                </p>
              )}
              {land.village && (
                <p className="text-xs text-muted-foreground">
                  📍 {land.village}, {land.taluka}
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Weather Information */}
          {showWeather && (() => {
            // Extract coordinates from center_point or center_point_old
            const centerPoint = land.center_point_old || land.center_point;
            if (centerPoint && typeof centerPoint === 'object') {
              const coords = (centerPoint as any).coordinates;
              if (coords && Array.isArray(coords) && coords.length >= 2) {
                return (
                  <LandWeatherCard 
                    landId={land.id}
                    latitude={coords[1]}
                    longitude={coords[0]}
                  />
                );
              }
            }
            return null;
          })()}

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Area</p>
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-primary" />
                <p className="text-lg font-bold text-foreground">
                  {land.area_acres.toFixed(1)} acres
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Ownership</p>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {land.ownership_type?.charAt(0).toUpperCase() + land.ownership_type?.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Current Crop Information */}
          {land.current_crop && (
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Current Crop</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Crop:</span>
                  <div className="font-medium text-foreground">{land.current_crop.crop_name}</div>
                </div>
                {land.current_crop.variety && (
                  <div>
                    <span className="text-muted-foreground">Variety:</span>
                    <div className="font-medium text-foreground">{land.current_crop.variety}</div>
                  </div>
                )}
                {land.current_crop.growth_stage && (
                  <div>
                    <span className="text-muted-foreground">Stage:</span>
                    <Badge variant="outline" className="text-xs">{land.current_crop.growth_stage}</Badge>
                  </div>
                )}
                {land.current_crop.season && (
                  <div>
                    <span className="text-muted-foreground">Season:</span>
                    <Badge variant="outline" className="text-xs">{land.current_crop.season}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Soil Health Information */}
          {land.soil_health && (
            <div className="space-y-3 p-4 bg-accent/5 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2">
                <TestTube className="w-4 h-4 text-accent" />
                <h4 className="font-semibold text-foreground">Soil Health</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {land.soil_health.ph_level && (
                  <div>
                    <span className="text-muted-foreground">pH Level:</span>
                    <div className="font-bold text-foreground">{land.soil_health.ph_level}</div>
                  </div>
                )}
                {land.soil_health.nitrogen_level && (
                  <div>
                    <span className="text-muted-foreground">Nitrogen:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        land.soil_health.nitrogen_level === 'high' ? 'text-green-600' :
                        land.soil_health.nitrogen_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {land.soil_health.nitrogen_level}
                    </Badge>
                  </div>
                )}
                {land.soil_health.organic_carbon && (
                  <div>
                    <span className="text-muted-foreground">Organic C:</span>
                    <div className="font-bold text-foreground">{land.soil_health.organic_carbon.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Statistics */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Irrigation</p>
                <p className="text-sm font-medium text-foreground">
                  {land.irrigation_source || 'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Recent Activity</p>
                <p className="text-sm font-medium text-foreground">
                  {land.recent_activities?.length || 0} activities
                </p>
              </div>
            </div>
          </div>

          {/* NDVI Health Status */}
          {land.recent_ndvi && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-foreground">Crop Health (NDVI)</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(land.recent_ndvi.ndvi_value * 100).toFixed(0)}%
                </Badge>
              </div>
              <Progress 
                value={land.recent_ndvi.ndvi_value * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(land.recent_ndvi.date).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 hover:bg-primary/10 hover:border-primary transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(land);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 hover:bg-accent/10 hover:border-accent transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Analysis
            </Button>
          </div>

          {/* Enhanced Status Footer */}
          {isOffline ? (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <WifiOff className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                  Offline Data
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Wifi className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Live Data
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </LandErrorBoundary>
  );
};