import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react';
import { LandWithDetails } from '@/types/land';
import { useToast } from '@/hooks/use-toast';

interface SoilDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  land: LandWithDetails | null;
}

export const SoilDataModal: React.FC<SoilDataModalProps> = ({
  open,
  onOpenChange,
  land
}) => {
  const { toast } = useToast();
  const [isGettingSoilData, setIsGettingSoilData] = useState(false);

  const handleGetSoilData = async () => {
    setIsGettingSoilData(true);
    
    // Simulate soil data fetching
    setTimeout(() => {
      setIsGettingSoilData(false);
      toast({
        title: "Soil Data Request Sent",
        description: "We'll connect you with certified soil testing labs in your area.",
      });
    }, 2000);
  };

  const getSoilHealthIndicator = (value: number | undefined, optimal: [number, number]) => {
    if (!value) return { status: 'unknown', color: 'bg-gray-400' };
    
    if (value >= optimal[0] && value <= optimal[1]) {
      return { status: 'optimal', color: 'bg-green-500' };
    } else if (value < optimal[0]) {
      return { status: 'low', color: 'bg-red-500' };
    } else {
      return { status: 'high', color: 'bg-yellow-500' };
    }
  };

  if (!land) return null;

  const soilData = land.soil_health;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            Soil Data - {land.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {soilData ? (
            <>
              {/* Soil Health Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Soil Health Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* pH Level */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {soilData.ph_level || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">pH Level</div>
                      <div className={`w-3 h-3 rounded-full mx-auto ${
                        getSoilHealthIndicator(soilData.ph_level, [6.0, 7.5]).color
                      }`} />
                      <div className="text-xs mt-1">
                        {getSoilHealthIndicator(soilData.ph_level, [6.0, 7.5]).status}
                      </div>
                    </div>

                    {/* Organic Carbon */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {soilData.organic_carbon ? `${soilData.organic_carbon}%` : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">Organic Carbon</div>
                      <div className={`w-3 h-3 rounded-full mx-auto ${
                        getSoilHealthIndicator(soilData.organic_carbon, [0.75, 2.0]).color
                      }`} />
                      <div className="text-xs mt-1">
                        {getSoilHealthIndicator(soilData.organic_carbon, [0.75, 2.0]).status}
                      </div>
                    </div>

                    {/* Overall Health Score */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {land.health_score ? `${land.health_score.toFixed(1)}/5` : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">Health Score</div>
                      {land.health_score && (
                        <Progress value={land.health_score * 20} className="w-16 mx-auto" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nutrient Levels */}
              <Card>
                <CardHeader>
                  <CardTitle>Nutrient Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Nitrogen (N)</span>
                        <Badge variant={
                          soilData.nitrogen_level === 'high' ? 'default' :
                          soilData.nitrogen_level === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {soilData.nitrogen_level || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Essential for leaf growth and green color
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Phosphorus (P)</span>
                        <Badge variant={
                          soilData.phosphorus_level === 'high' ? 'default' :
                          soilData.phosphorus_level === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {soilData.phosphorus_level || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Important for root development and flowering
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Potassium (K)</span>
                        <Badge variant={
                          soilData.potassium_level === 'high' ? 'default' :
                          soilData.potassium_level === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {soilData.potassium_level || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Helps with disease resistance and water regulation
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Soil Properties */}
              <Card>
                <CardHeader>
                  <CardTitle>Soil Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Soil Type:</span>
                      <div className="font-medium">{soilData.soil_type || 'Not specified'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Texture:</span>
                      <div className="font-medium">{soilData.texture || 'Not specified'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Bulk Density:</span>
                      <div className="font-medium">
                        {soilData.bulk_density ? `${soilData.bulk_density} g/cm³` : 'Not measured'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Test Date:</span>
                      <div className="font-medium">
                        {soilData.test_date ? new Date(soilData.test_date).toLocaleDateString() : 'Not available'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Expert Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {soilData.nitrogen_level === 'low' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800">Nitrogen Deficiency</div>
                        <div className="text-sm text-yellow-700">
                          Consider applying nitrogen-rich fertilizers like urea or compost
                        </div>
                      </div>
                    )}
                    
                    {soilData.ph_level && (soilData.ph_level < 6.0 || soilData.ph_level > 7.5) && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800">pH Adjustment Needed</div>
                        <div className="text-sm text-blue-700">
                          {soilData.ph_level < 6.0 
                            ? 'Soil is acidic. Consider adding lime to increase pH.'
                            : 'Soil is alkaline. Consider adding organic matter to lower pH.'
                          }
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-800">General Recommendation</div>
                      <div className="text-sm text-green-700">
                        Regular soil testing every 2-3 years helps maintain optimal soil health for better crop yields.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* No Soil Data Available */
            <Card>
              <CardContent className="p-8 text-center">
                <TestTube className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Soil Data Available</h3>
                <p className="text-muted-foreground mb-6">
                  Get detailed soil analysis to optimize your crop yields and soil health.
                </p>
                
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="text-left p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium mb-2">What you'll get:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• pH level and nutrient analysis</li>
                      <li>• Soil health recommendations</li>
                      <li>• Fertilizer suggestions</li>
                      <li>• Crop-specific advice</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={handleGetSoilData}
                    disabled={isGettingSoilData}
                    className="w-full"
                  >
                    {isGettingSoilData ? 'Connecting...' : 'Get Soil Test'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    We'll connect you with certified labs in your area
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};