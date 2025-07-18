
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileNumberService, SIMInfo } from '@/services/MobileNumberService';
import { SIMDetectionService } from '@/services/SIMDetectionService';
import { Smartphone, RefreshCw, Info } from 'lucide-react';

export const SIMDebugPanel: React.FC = () => {
  const [sims, setSims] = useState<SIMInfo[]>([]);
  const [platformInfo, setPlatformInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simService = new SIMDetectionService();
  const mobileService = MobileNumberService.getInstance();

  const detectSIMs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [detectedSims, platform] = await Promise.all([
        mobileService.detectSIMCards(),
        simService.getPlatformInfo()
      ]);
      
      setSims(detectedSims);
      setPlatformInfo(platform);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect SIMs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectSIMs();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5" />
          <span>SIM Detection Debug Panel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Information */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-semibold flex items-center space-x-2 mb-2">
            <Info className="w-4 h-4" />
            <span>Platform Information</span>
          </h3>
          {platformInfo ? (
            <div className="text-sm space-y-1">
              <p><strong>Platform:</strong> {platformInfo.platform}</p>
              <p><strong>Is Native:</strong> {platformInfo.isNative ? 'Yes' : 'No'}</p>
              <p><strong>Has SIM Plugin:</strong> {platformInfo.hasPlugin ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading platform info...</p>
          )}
        </div>

        {/* Refresh Button */}
        <Button 
          onClick={detectSIMs} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh SIM Detection
        </Button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* SIM Cards Display */}
        <div className="space-y-3">
          <h3 className="font-semibold">Detected SIM Cards ({sims.length})</h3>
          {sims.length === 0 ? (
            <p className="text-gray-500 text-sm">No SIM cards detected</p>
          ) : (
            sims.map((sim) => (
              <div key={sim.slot} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{sim.displayName}</p>
                    <p className="text-sm text-gray-600">
                      Slot {sim.slot} • {sim.carrierName}
                    </p>
                    <p className="text-sm font-mono">{sim.phoneNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sim.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sim.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {sim.isDefault && (
                      <span className="block mt-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-medium text-yellow-800 mb-2">Testing Instructions</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• On web: Shows mock data for development</li>
            <li>• On device: Attempts to read real SIM information</li>
            <li>• May require SIM reading permissions on device</li>
            <li>• Some carriers may not expose phone numbers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
