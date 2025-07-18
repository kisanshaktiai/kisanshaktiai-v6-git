
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { customAuthService } from '@/services/customAuthService';
import { Bug, Shield, User, Clock, AlertTriangle } from 'lucide-react';

interface AuthDebugInfo {
  isAuthenticated: boolean;
  farmer: any;
  token: string | null;
  lastActivity: string | null;
  deviceFingerprint: string;
}

export const AuthDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { farmer, isAuthenticated, signOut } = useCustomAuth();

  useEffect(() => {
    if (isOpen) {
      loadDebugInfo();
    }
  }, [isOpen, farmer]);

  const loadDebugInfo = () => {
    const token = customAuthService.getCurrentToken();
    const lastActivity = localStorage.getItem('kisanshakti_last_activity');
    
    setDebugInfo({
      isAuthenticated,
      farmer,
      token,
      lastActivity,
      deviceFingerprint: 'generated_fingerprint'
    });
  };

  const handleClearAuth = async () => {
    await signOut();
    loadDebugInfo();
  };

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(parseInt(timestamp)).toLocaleString();
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug Auth
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Shield className="w-5 h-5" />
            <span>Auth Debug Panel</span>
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
        {debugInfo && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={debugInfo.isAuthenticated ? "default" : "secondary"}>
                {debugInfo.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </div>

            {debugInfo.farmer && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Farmer Info:</span>
                </div>
                <div className="pl-6 space-y-1 text-xs">
                  <div>ID: {debugInfo.farmer.id}</div>
                  <div>Code: {debugInfo.farmer.farmer_code}</div>
                  <div>Mobile: {debugInfo.farmer.mobile_number}</div>
                  <div>Tenant: {debugInfo.farmer.tenant_id || 'None'}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Session Info:</span>
              </div>
              <div className="pl-6 space-y-1 text-xs">
                <div>Token: {debugInfo.token ? 'Present' : 'None'}</div>
                <div>Last Activity: {formatDate(debugInfo.lastActivity)}</div>
                <div>Device: {debugInfo.deviceFingerprint.substring(0, 8)}...</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={loadDebugInfo}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Refresh
              </Button>
              <Button
                onClick={handleClearAuth}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                Clear Auth
              </Button>
            </div>

            <div className="text-xs text-gray-500 border-t pt-2">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Debug panel - Development only</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
