
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Grid, List, Filter } from 'lucide-react';
import { LandCard } from '@/components/land/LandCard';
import { LandFilters } from '@/components/land/LandFilters';
import { FullScreenMapModal } from '@/components/land/FullScreenMapModal';
import { LandFormModal } from '@/components/land/LandFormModal';
import { LandDetailModal } from '@/components/land/LandDetailModal';
import { useLands } from '@/hooks/useLands';
import { LandWithDetails } from '@/types/land';

export const MyLands: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: lands = [], isLoading, error } = useLands();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLands, setSelectedLands] = useState<Set<string>>(new Set());
  const [showMapModal, setShowMapModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedLandDetail, setSelectedLandDetail] = useState<LandWithDetails | null>(null);
  const [boundaryData, setBoundaryData] = useState<{
    points: any[];
    area: number;
    centerPoint: any;
    enhancedData?: any;
  } | null>(null);
  const [filters, setFilters] = useState({
    cropType: undefined as string | undefined,
    soilHealth: undefined as string | undefined,
    ownershipType: undefined as string | undefined,
    sizeRange: undefined as string | undefined,
  });

  // Filter and search lands
  const filteredLands = useMemo(() => {
    let filtered = lands;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(land =>
        land.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        land.current_crop?.crop_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.cropType) {
      filtered = filtered.filter(land =>
        land.current_crop?.crop_name === filters.cropType
      );
    }

    if (filters.ownershipType) {
      filtered = filtered.filter(land =>
        land.ownership_type === filters.ownershipType
      );
    }

    if (filters.soilHealth) {
      filtered = filtered.filter(land => {
        if (!land.health_score) return false;
        const level = getHealthLabel(land.health_score);
        return level === filters.soilHealth;
      });
    }

    return filtered;
  }, [lands, searchTerm, filters]);

  const getHealthLabel = (score: number) => {
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  };

  const handleLandSelect = (land: LandWithDetails) => {
    setSelectedLands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(land.id)) {
        newSet.delete(land.id);
      } else {
        newSet.add(land.id);
      }
      return newSet;
    });
  };

  const handleAddLand = () => {
    setShowMapModal(true);
  };

  const handleBoundaryComplete = (points: any[], area: number, centerPoint: any, enhancedData?: any) => {
    setBoundaryData({ points, area, centerPoint, enhancedData });
    setShowMapModal(false);
    setShowFormModal(true);
  };

  const handleLandSaved = () => {
    setShowFormModal(false);
    setBoundaryData(null);
  };

  const handleLandEdit = (land: LandWithDetails) => {
    setSelectedLandDetail(land);
  };

  const clearFilters = () => {
    setFilters({
      cropType: undefined,
      soilHealth: undefined,
      ownershipType: undefined,
      sizeRange: undefined,
    });
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Lands</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Lands</h1>
        <p className="text-red-600">Error loading lands. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Lands</h1>
          <p className="text-gray-600 text-sm">
            {filteredLands.length} of {lands.length} lands
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button size="sm" onClick={handleAddLand}>
            <Plus className="w-4 h-4 mr-2" />
            Add Land
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <LandFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedFilters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedLands.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedLands.size} land{selectedLands.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLands(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lands Grid/List */}
      {filteredLands.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-4' : 'space-y-4'}>
          {filteredLands.map((land) => (
            <LandCard
              key={land.id}
              land={land}
              onSelect={handleLandSelect}
              onEdit={handleLandEdit}
              selected={selectedLands.has(land.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(Boolean) 
              ? 'No lands match your criteria' 
              : 'No lands added yet'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(Boolean)
              ? 'Try adjusting your search or filters'
              : 'Add your first land to get started with field management'
            }
          </p>
          {searchTerm || Object.values(filters).some(Boolean) ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={handleAddLand}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Land
            </Button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {lands.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Land Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {lands.reduce((sum, land) => sum + land.area_acres, 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">Total Acres</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {lands.filter(land => land.current_crop).length}
                </div>
                <div className="text-xs text-gray-600">Active Crops</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {lands.filter(land => land.health_score && land.health_score >= 3).length}
                </div>
                <div className="text-xs text-gray-600">Healthy Lands</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {lands.reduce((sum, land) => sum + (land.recent_activities?.length || 0), 0)}
                </div>
                <div className="text-xs text-gray-600">Recent Activities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <FullScreenMapModal 
        open={showMapModal}
        onOpenChange={setShowMapModal}
        onBoundaryComplete={handleBoundaryComplete}
      />
      
      {boundaryData && (
        <LandFormModal
          open={showFormModal}
          onOpenChange={setShowFormModal}
          boundaryPoints={boundaryData.points}
          calculatedArea={boundaryData.area}
          centerPoint={boundaryData.centerPoint}
          enhancedData={boundaryData.enhancedData}
          onSuccess={handleLandSaved}
        />
      )}
      
      <LandDetailModal
        land={selectedLandDetail}
        open={!!selectedLandDetail}
        onOpenChange={(open) => !open && setSelectedLandDetail(null)}
        onEdit={handleLandEdit}
      />
    </div>
  );
};
