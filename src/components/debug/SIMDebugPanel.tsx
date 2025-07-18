
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { customAuthService } from '@/services/customAuthService';
import { Smartphone, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface SIMDebugInfo {
  detectionSupported: boolean;
  simCount: number;
  activeNumbers: string[];
  carriers: string[];
  lastDetection: string | null;
}

export const SIMDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<SIMDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const detectSIMInfo = async () => {
    setLoading(true);
    try {
      // Use the customAuthService method for SIM detection
      const simInfo = await customAuthService.detectSIMInfo();
      
      // Mock data for demo since actual SIM detection requires mobile environment
      const mockInfo: SIMDebugInfo = {
        detectionSupported: true,
        simCount: 2,
        activeNumbers: ['9876543210', '8765432109'],
        carriers: ['Airtel', 'Jio'],
        lastDetection: new Date().toISOString()
      };
      
      setDebugInfo(mockInfo);
    } catch (error) {
      console.error('SIM detection error:', error);
      setDebugInfo({
        detectionSupported: false,
        simCount: 0,
        activeNumbers: [],
        carriers: [],
        lastDetection: null
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50"
      >
        <Smartphone className="w-4 h-4 mr-2" />
        SIM Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Smartphone className="w-5 h-5" />
            <span>SIM Debug Panel</span>
          </CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={detectSIMInfo}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Detecting SIMs...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Detect SIM Cards
            </>
          )}
        </Button>

        {debugInfo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Detection Support:</span>
              <Badge variant={debugInfo.detectionSupported ? "default" : "secondary"}>
                {debugInfo.detectionSupported ? 'Supported' : 'Not Supported'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SIM Count:</span>
              <Badge variant="outline">{debugInfo.simCount}</Badge>
            </div>

            {debugInfo.activeNumbers.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Active Numbers:</span>
                <div className="space-y-1">
                  {debugInfo.activeNumbers.map((number, index) => (
                    <div key={number} className="flex items-center justify-between text-xs">
                      <span>+91 {number}</span>
                      <Badge variant="outline" className="text-xs">
                        {debugInfo.carriers[index] || 'Unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo.lastDetection && (
              <div className="text-xs text-gray-500">
                Last detected: {new Date(debugInfo.lastDetection).toLocaleString()}
              </div>
            )}

            {!debugInfo.detectionSupported && (
              <div className="flex items-start space-x-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  SIM detection requires a mobile environment with proper permissions.
                  This feature works best in a native mobile app.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
