import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar, Download, ZoomIn, ZoomOut, Play, Pause, RotateCcw } from 'lucide-react';

interface NDVIVisualizationProps {
  landId: string;
  ndviData: any[];
  satelliteImagery: any[];
  onDownload: (imagery: any) => void;
}

const NDVIVisualization: React.FC<NDVIVisualizationProps> = ({
  landId,
  ndviData,
  satelliteImagery,
  onDownload
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [visualization, setVisualization] = useState<'ndvi' | 'evi' | 'ndwi' | 'savi'>('ndvi');
  const [zoom, setZoom] = useState(1);
  const [isTimeLapse, setIsTimeLapse] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [colorScheme, setColorScheme] = useState<'viridis' | 'rdylgn' | 'spectral'>('rdylgn');

  useEffect(() => {
    if (ndviData.length > 0 && !selectedDate) {
      setSelectedDate(ndviData[0].date);
    }
  }, [ndviData, selectedDate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimeLapse && ndviData.length > 1) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % ndviData.length);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimeLapse, ndviData.length]);

  const selectedNdviData = selectedDate ? 
    ndviData.find(data => data.date === selectedDate) :
    ndviData[currentFrame];

  const getValueRange = (type: string) => {
    switch (type) {
      case 'ndvi':
        return { min: 0, max: 1, label: 'NDVI' };
      case 'evi':
        return { min: 0, max: 1, label: 'EVI' };
      case 'ndwi':
        return { min: -1, max: 1, label: 'NDWI' };
      case 'savi':
        return { min: 0, max: 1, label: 'SAVI' };
      default:
        return { min: 0, max: 1, label: 'Index' };
    }
  };

  const getHealthInterpretation = (value: number, type: string) => {
    if (type === 'ndvi') {
      if (value > 0.7) return { level: 'Excellent', color: 'bg-green-600' };
      if (value > 0.5) return { level: 'Good', color: 'bg-green-400' };
      if (value > 0.3) return { level: 'Fair', color: 'bg-yellow-400' };
      if (value > 0.1) return { level: 'Poor', color: 'bg-orange-500' };
      return { level: 'Critical', color: 'bg-red-600' };
    }
    return { level: 'Normal', color: 'bg-gray-400' };
  };

  const currentValue = selectedNdviData ? selectedNdviData[`${visualization}_value`] : null;
  const range = getValueRange(visualization);
  const interpretation = currentValue ? getHealthInterpretation(currentValue, visualization) : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization Controls</CardTitle>
          <CardDescription>Configure the satellite imagery display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Index Type</label>
              <Select value={visualization} onValueChange={(value: any) => setVisualization(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ndvi">NDVI (Vegetation Health)</SelectItem>
                  <SelectItem value="evi">EVI (Enhanced Vegetation)</SelectItem>
                  <SelectItem value="ndwi">NDWI (Water Content)</SelectItem>
                  <SelectItem value="savi">SAVI (Soil Adjusted)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Select value={selectedDate} onValueChange={setSelectedDate} disabled={isTimeLapse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {ndviData.map((data) => (
                    <SelectItem key={data.date} value={data.date}>
                      {new Date(data.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color Scheme</label>
              <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rdylgn">Red-Yellow-Green</SelectItem>
                  <SelectItem value="viridis">Viridis</SelectItem>
                  <SelectItem value="spectral">Spectral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Zoom Level</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[4rem] text-center">{zoom.toFixed(2)}x</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIsTimeLapse(!isTimeLapse)}
              className="gap-2"
              disabled={ndviData.length < 2}
            >
              {isTimeLapse ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              Time-lapse {isTimeLapse ? 'Playing' : 'Stopped'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setZoom(1)}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset View
            </Button>

            {selectedNdviData && (
              <Button
                variant="outline"
                onClick={() => onDownload(selectedNdviData)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {range.label} Map
                {isTimeLapse && (
                  <Badge variant="secondary">
                    Frame {currentFrame + 1}/{ndviData.length}
                  </Badge>
                )}
              </CardTitle>
              {selectedNdviData && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(selectedNdviData.date).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <CardDescription>
              {selectedNdviData?.scene_id && `Scene: ${selectedNdviData.scene_id}`}
              {selectedNdviData?.cloud_coverage !== undefined && 
                ` • Cloud coverage: ${selectedNdviData.cloud_coverage.toFixed(1)}%`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="relative bg-gray-100 rounded-lg overflow-hidden"
              style={{ height: '400px' }}
            >
              {/* Mock satellite image display */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-green-200 via-yellow-200 to-red-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <p className="text-lg font-medium">
                      {range.label} Visualization
                    </p>
                    <p className="text-sm">
                      {currentValue ? `Value: ${currentValue.toFixed(3)}` : 'No data available'}
                    </p>
                    <p className="text-xs mt-2">
                      Interactive map would be displayed here
                    </p>
                  </div>
                </div>
              </div>

              {/* Zoom controls overlay */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Color scale legend */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>{range.min}</span>
                <div className="flex-1 mx-4 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded"></div>
                <span>{range.max}</span>
              </div>
              <p className="text-xs text-center mt-1 text-muted-foreground">
                {range.label} Scale
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Panel */}
        <div className="space-y-4">
          {/* Current Value */}
          <Card>
            <CardHeader>
              <CardTitle>Current Value</CardTitle>
            </CardHeader>
            <CardContent>
              {currentValue !== null ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{currentValue.toFixed(3)}</div>
                    <div className="text-sm text-muted-foreground">{range.label}</div>
                  </div>
                  
                  {interpretation && (
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${interpretation.color}`}></div>
                      <span className="text-sm font-medium">{interpretation.level}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-primary rounded"
                        style={{ 
                          width: `${((currentValue - range.min) / (range.max - range.min)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {selectedNdviData && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Min</div>
                    <div className="font-medium">
                      {selectedNdviData.ndvi_min?.toFixed(3) || '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max</div>
                    <div className="font-medium">
                      {selectedNdviData.ndvi_max?.toFixed(3) || '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg</div>
                    <div className="font-medium">
                      {selectedNdviData.ndvi_value?.toFixed(3) || '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Std Dev</div>
                    <div className="font-medium">
                      {selectedNdviData.ndvi_std?.toFixed(3) || '--'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Info */}
          {selectedNdviData && (
            <Card>
              <CardHeader>
                <CardTitle>Image Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  <span>{selectedNdviData.satellite_source || 'Sentinel-2'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(selectedNdviData.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cloud:</span>
                  <span>{selectedNdviData.cloud_coverage?.toFixed(1) || '--'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution:</span>
                  <span>{selectedNdviData.spatial_resolution || 10}m</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NDVIVisualization;