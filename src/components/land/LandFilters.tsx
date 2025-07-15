
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface LandFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilters: {
    cropType?: string;
    soilHealth?: string;
    ownershipType?: string;
    sizeRange?: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const LandFilters: React.FC<LandFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedFilters,
  onFilterChange,
  onClearFilters,
}) => {
  const cropTypes = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize', 'Soybean'];
  const healthLevels = ['Excellent', 'Good', 'Fair', 'Poor'];
  const ownershipTypes = ['owned', 'leased', 'shared', 'rented'];
  const sizeRanges = ['< 1 acre', '1-5 acres', '5-10 acres', '> 10 acres'];

  const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length;

  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search lands by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Categories */}
        <div className="space-y-3">
          {/* Crop Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Crop Type
            </label>
            <div className="flex flex-wrap gap-2">
              {cropTypes.map((crop) => (
                <Badge
                  key={crop}
                  variant={selectedFilters.cropType === crop ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    onFilterChange({
                      ...selectedFilters,
                      cropType: selectedFilters.cropType === crop ? undefined : crop
                    })
                  }
                >
                  {crop}
                </Badge>
              ))}
            </div>
          </div>

          {/* Soil Health Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Soil Health
            </label>
            <div className="flex flex-wrap gap-2">
              {healthLevels.map((level) => (
                <Badge
                  key={level}
                  variant={selectedFilters.soilHealth === level ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    onFilterChange({
                      ...selectedFilters,
                      soilHealth: selectedFilters.soilHealth === level ? undefined : level
                    })
                  }
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ownership Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Ownership
            </label>
            <div className="flex flex-wrap gap-2">
              {ownershipTypes.map((type) => (
                <Badge
                  key={type}
                  variant={selectedFilters.ownershipType === type ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => 
                    onFilterChange({
                      ...selectedFilters,
                      ownershipType: selectedFilters.ownershipType === type ? undefined : type
                    })
                  }
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm text-gray-600">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
