
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Droplets, Activity, TrendingUp } from 'lucide-react';
import { LandWithDetails } from '@/types/land';

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
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-green-500' : ''
      }`}
      onClick={() => onSelect?.(land)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{land.name}</CardTitle>
          <div className="flex items-center space-x-2">
            {land.health_score && (
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${getHealthColor(land.health_score)}`} />
                <span className="text-xs text-gray-600">
                  {getHealthLabel(land.health_score)}
                </span>
              </div>
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
        </div>
      </CardContent>
    </Card>
  );
};
