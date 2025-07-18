import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { authHealthService } from '@/services/authHealthService';
import { sessionService } from '@/services/sessionService';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface AuthHealthCheck {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    supabaseConnection: boolean;
    sessionValid: boolean;
    profileExists: boolean;
    edgeFunctionReachable: boolean;
  };
  errors: string[];
  timestamp: string;
}

export const AuthDebugPanel: React.FC = () => {
  const [healthCheck, setHealthCheck] = useState<AuthHealthCheck | null>(null);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('9876543210');
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      
      // Get health check
      const health = await authHealthService.performHealthCheck();
      setHealthCheck(health);
      
      // Get debug logs
      const logs = authHealthService.getDebugLogs();
      setDebugLogs(logs.slice(0, 10)); // Last 10 events
      
      // Get current session info
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const validation = sessionService.validateSessionData(session);
        setSessionInfo({
          valid: validation.isValid,
          error: validation.error,
          user: session.user?.id,
          expires_at: session.expires_at,
          expires_in: session.expires_in
        });
      } else {
        setSessionInfo(null);
      }
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPhoneDiagnosis = async () => {
    try {
      setLoading(true);
      const diagnosis = await authHealthService.diagnoseAuthIssue(testPhone);
      
      alert(`Diagnosis for ${testPhone}:
User Exists: ${diagnosis.userExists}
Profile Exists: ${diagnosis.profileExists}
Auth Record Exists: ${diagnosis.authRecordExists}

Issues: ${diagnosis.issues.join(', ') || 'None'}
Recommendations: ${diagnosis.recommendations.join(', ') || 'None'}`);
    } catch (error) {
      alert(`Diagnosis failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSessionRestore = async () => {
    try {
      setLoading(true);
      const restored = await sessionService.restoreSession();
      
      if (restored) {
        alert('Session restored successfully!');
        await loadDebugInfo();
      } else {
        alert('No session to restore or restoration failed');
      }
    } catch (error) {
      alert(`Session restore failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearDebugLogs = () => {
    authHealthService.clearDebugLogs();
    setDebugLogs([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!healthCheck) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Auth Debug Panel...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Health Check Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthCheck.status)}
            Authentication Health Check
            <Badge className={getStatusColor(healthCheck.status)}>
              {healthCheck.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className={`h-3 w-3 rounded-full mx-auto mb-1 ${healthCheck.checks.supabaseConnection ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm">Supabase</p>
            </div>
            <div className="text-center">
              <div className={`h-3 w-3 rounded-full mx-auto mb-1 ${healthCheck.checks.sessionValid ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm">Session</p>
            </div>
            <div className="text-center">
              <div className={`h-3 w-3 rounded-full mx-auto mb-1 ${healthCheck.checks.profileExists ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm">Profile</p>
            </div>
            <div className="text-center">
              <div className={`h-3 w-3 rounded-full mx-auto mb-1 ${healthCheck.checks.edgeFunctionReachable ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm">Edge Function</p>
            </div>
          </div>
          
          {healthCheck.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="font-medium text-red-800 mb-2">Issues Found:</p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {healthCheck.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button onClick={loadDebugInfo} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={testSessionRestore} disabled={loading} variant="outline" size="sm">
              Test Session Restore
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Session Info */}
      {sessionInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Current Session Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Valid:</span>
                <Badge className={sessionInfo.valid ? 'bg-green-500' : 'bg-red-500'}>
                  {sessionInfo.valid ? 'Yes' : 'No'}
                </Badge>
              </div>
              {sessionInfo.error && (
                <div className="flex justify-between">
                  <span>Error:</span>
                  <span className="text-red-500">{sessionInfo.error}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="font-mono text-xs">{sessionInfo.user || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Expires At:</span>
                <span>{sessionInfo.expires_at ? new Date(sessionInfo.expires_at * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Expires In:</span>
                <span>{sessionInfo.expires_in ? `${sessionInfo.expires_in}s` : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Diagnosis Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Diagnosis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1 px-3 py-2 border rounded"
              maxLength={10}
            />
            <Button onClick={testPhoneDiagnosis} disabled={loading}>
              Diagnose
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Recent Auth Events
            <Button onClick={clearDebugLogs} variant="outline" size="sm">
              Clear Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugLogs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {debugLogs.map((log, index) => (
                <div key={index} className="p-3 border rounded text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline">{log.event}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.details && (
                    <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No debug logs available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebugPanel;