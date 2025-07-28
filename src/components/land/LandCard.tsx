
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Droplets, Activity, TrendingUp, TestTube, Satellite, WifiOff, Eye, MoreVertical } from 'lucide-react';
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

  // Generate map thumbnail
  useEffect(() => {
    if (!mapRef.current || mapLoaded || !land.boundary_polygon) return;

    // Create a simple static map thumbnail
    const loadStaticMap = async () => {
      try {
        if (land.boundary_polygon && typeof land.boundary_polygon === 'object') {
          const polygon = land.boundary_polygon as any;
          if (polygon.coordinates && polygon.coordinates[0]) {
            const coords = polygon.coordinates[0];
            const centerLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
            const centerLng = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length;
            
            // Create simple SVG map placeholder
            const svg = `
              <svg width="100%" height="100%" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f9ff"/>
                <polygon points="${coords.map((coord: number[], i: number) => 
                  `${20 + (i * 15) % 80},${20 + (i * 10) % 40}`
                ).join(' ')}" 
                fill="${tenant?.branding?.primary_color || '#10B981'}40" 
                stroke="${tenant?.branding?.primary_color || '#10B981'}" 
                stroke-width="1"/>
                <circle cx="60" cy="40" r="2" fill="${tenant?.branding?.primary_color || '#10B981'}"/>
              </svg>
            `;
            
            if (mapRef.current) {
              mapRef.current.innerHTML = svg;
              setMapLoaded(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading map thumbnail:', error);
      }
    };

    loadStaticMap();
  }, [land.boundary_polygon, tenant?.branding?.primary_color, mapLoaded]);
  const getHealthColor = (score?: number) => {
    if (!score) return 'bg-gray-400';
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  };

  return (
    <LandErrorBoundary>
      <Card 
        className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 ${
          selected ? 'ring-2 ring-primary shadow-lg' : ''
        } ${isOffline ? 'opacity-75 border-dashed' : ''} bg-gradient-to-br from-background to-background/50 border border-border/50`}
        onClick={() => onSelect?.(land)}
      >
      {/* Enhanced Map Thumbnail Header */}
      <div className="relative h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-t-lg overflow-hidden">
        <div 
          ref={mapRef}
          className="absolute inset-0 opacity-70 transition-opacity group-hover:opacity-90"
        />
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Area Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant="secondary" 
            className="bg-background/90 backdrop-blur-sm text-xs font-medium shadow-sm"
          >
            {land.area_acres.toFixed(1)} acres
          </Badge>
        </div>
        
        {/* Health Score */}
        <div className="absolute top-3 right-3">
          {land.health_score && (
            <div 
              className={`w-4 h-4 rounded-full ${getHealthColor(land.health_score)} shadow-sm ring-2 ring-background/80`} 
              title={`Health: ${getHealthLabel(land.health_score)}`} 
            />
          )}
        </div>
        
        {/* Type Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge 
            variant="outline" 
            className="bg-background/80 backdrop-blur-sm text-xs border-white/20"
          >
            <Satellite className="w-3 h-3 mr-1" />
            {land.ownership_type}
          </Badge>
        </div>
        
        {/* Quick Action */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="secondary"
            className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(land);
            }}
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate text-foreground group-hover:text-primary transition-colors">
              {land.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {land.survey_number ? `Survey: ${land.survey_number}` : 'GPS Mapped'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {land.health_score && (
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${
                  land.health_score >= 4 ? 'border-green-500/50 text-green-700 bg-green-50' :
                  land.health_score >= 3 ? 'border-yellow-500/50 text-yellow-700 bg-yellow-50' :
                  'border-red-500/50 text-red-700 bg-red-50'
                }`}
              >
                {getHealthLabel(land.health_score)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weather Integration */}
        {showWeather && land.boundary_polygon && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
            <LandWeatherCard
              landId={land.id}
              latitude={18.5} // fallback - would extract from boundary in real implementation
              longitude={73.7}
              cropType={land.current_crop?.crop_name}
              compact
            />
          </div>
        )}
        
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Total Area</p>
                <p className="text-lg font-bold text-green-700">{land.area_acres.toFixed(1)}</p>
                <p className="text-xs text-green-500">acres</p>
              </div>
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Type</p>
                <p className="text-lg font-bold text-purple-700 capitalize">{land.ownership_type}</p>
                <p className="text-xs text-purple-500">ownership</p>
              </div>
              <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Current Crop */}
        {land.current_crop && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium">Current Crop</p>
                <p className="text-sm font-semibold text-amber-700">{land.current_crop.crop_name}</p>
                {land.current_crop.variety && (
                  <p className="text-xs text-amber-500">{land.current_crop.variety}</p>
                )}
              </div>
              <Badge 
                variant="outline" 
                className="border-amber-200 text-amber-700 bg-amber-50"
              >
                {land.current_crop.growth_stage || 'Active'}
              </Badge>
            </div>
          </div>
        )}

        {/* Enhanced Soil Health Summary */}
        {land.soil_health && (
          <div className="bg-gradient-to-r from-stone-50 to-slate-50 rounded-lg p-3 border border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-stone-600 font-medium">Soil Health</p>
              <TestTube className="w-3 h-3 text-stone-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xs text-stone-500">pH Level</div>
                <div className="font-bold text-stone-700">
                  {land.soil_health.ph_level?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-stone-500">Nitrogen</div>
                <div className="font-bold text-stone-700 capitalize">
                  {land.soil_health.nitrogen_level || 'N/A'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-stone-500">OC %</div>
                <div className="font-bold text-stone-700">
                  {land.soil_health.organic_carbon?.toFixed(1) || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-2 border border-blue-100">
            <Droplets className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-blue-600 font-medium">Irrigation</p>
              <p className="text-blue-700 font-semibold truncate">
                {land.irrigation_source || 'Not set'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-indigo-50 rounded-lg p-2 border border-indigo-100">
            <Activity className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="text-indigo-600 font-medium">Activities</p>
              <p className="text-indigo-700 font-semibold">
                {land.recent_activities?.length || 0} recent
              </p>
            </div>
          </div>
        </div>

        {/* NDVI Health Indicator */}
        {land.recent_ndvi && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-600 font-medium">Crop Health (NDVI)</p>
                <p className="text-lg font-bold text-teal-700">
                  {land.recent_ndvi.ndvi_value?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-teal-500">satellite data</p>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <Satellite className="w-4 h-4 text-teal-500" />
              </div>
            </div>
          </div>
        )}


        {/* Enhanced Action Buttons */}
        <div className="flex space-x-2 pt-2 border-t border-border/50">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
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
            className="border-primary/20 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(land);
            }}
            title="Soil Analysis"
          >
            <TestTube className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary/20 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              // Add more actions menu
            }}
            title="More Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        {/* Offline indicator */}
        {isOffline && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <WifiOff className="w-3 h-3" />
            <span>Saved offline - will sync when connected</span>
          </div>
        )}
      </CardContent>
    </Card>
    </LandErrorBoundary>
  );
};
