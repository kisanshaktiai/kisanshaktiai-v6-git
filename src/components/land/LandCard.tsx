
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Droplets, Activity, TrendingUp, TestTube, Satellite } from 'lucide-react';
import { LandWithDetails } from '@/types/land';
import { useTenant } from '@/hooks/useTenant';

interface LandCardProps {
  land: LandWithDetails;
  onSelect?: (land: LandWithDetails) => void;
  onEdit?: (land: LandWithDetails) => void;
  selected?: boolean;
}

export const LandCard: React.FC<LandCardProps> = ({ 
  land, 
  onSelect, 
  onEdit, 
  selected = false 
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
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect?.(land)}
    >
      {/* Map Thumbnail Header */}
      <div className="relative h-24 bg-gradient-to-br from-sky-100 to-green-100 rounded-t-lg overflow-hidden">
        <div 
          ref={mapRef}
          className="absolute inset-0 opacity-80"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {land.area_acres} acres
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          {land.health_score && (
            <div className={`w-3 h-3 rounded-full ${getHealthColor(land.health_score)}`} 
                 title={getHealthLabel(land.health_score)} />
          )}
        </div>
        <div className="absolute bottom-2 left-2">
          <Satellite className="w-4 h-4 text-white/80" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{land.name}</CardTitle>
          <div className="flex items-center space-x-1">
            {land.health_score && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">
                {getHealthLabel(land.health_score)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Area:</span>
            <div className="font-medium">{land.area_acres} acres</div>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <div className="font-medium capitalize">{land.ownership_type}</div>
          </div>
        </div>

        {/* Current Crop */}
        {land.current_crop && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Crop:</span>
            <Badge variant="outline">{land.current_crop.crop_name}</Badge>
          </div>
        )}

        {/* Soil Health Summary */}
        {land.soil_health && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-600">pH</div>
              <div className="font-medium">{land.soil_health.ph_level || 'N/A'}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">N</div>
              <div className="font-medium capitalize">
                {land.soil_health.nitrogen_level || 'N/A'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">OC</div>
              <div className="font-medium">{land.soil_health.organic_carbon || 'N/A'}%</div>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {land.survey_number ? `Survey: ${land.survey_number}` : 'Location set'}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Droplets className="w-3 h-3" />
            <span>{land.irrigation_source || 'No irrigation'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>{land.recent_activities?.length || 0} activities</span>
          </div>
        </div>

        {/* NDVI Indicator */}
        {land.recent_ndvi && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Crop Health (NDVI):</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="font-medium">{land.recent_ndvi.ndvi_value?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(land);
            }}
          >
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(land); // This will open detail modal, from there user can access soil data
            }}
            title="Get Soil Data"
          >
            <TestTube className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
