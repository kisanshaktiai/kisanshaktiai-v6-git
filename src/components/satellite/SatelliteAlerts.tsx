import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Clock, TrendingDown, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SatelliteAlertsProps {
  landId: string;
  alerts: any[];
  onRefresh: () => void;
}

const SatelliteAlerts: React.FC<SatelliteAlertsProps> = ({
  landId,
  alerts,
  onRefresh
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(false);

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.severity === filter
  );

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('satellite_alerts')
        .update({ status: 'acknowledged' })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert acknowledged');
      onRefresh();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('satellite_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert resolved');
      onRefresh();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'ndvi_drop':
        return <TrendingDown className="h-4 w-4" />;
      case 'health_decline':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length
  };

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Satellite Alerts</CardTitle>
              <CardDescription>Active alerts from satellite monitoring</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Alert Stats */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{alertStats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{alertStats.high}</div>
              <div className="text-sm text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{alertStats.medium}</div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{alertStats.low}</div>
              <div className="text-sm text-muted-foreground">Low</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by severity:</label>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'All clear! No satellite alerts for this land.'
                : `No ${filter} severity alerts found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      {getAlertTypeIcon(alert.alert_type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {alert.alert_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {alert.description && (
                        <p className="text-sm text-muted-foreground">
                          {alert.description}
                        </p>
                      )}

                      {/* Alert Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div>{new Date(alert.created_at).toLocaleDateString()}</div>
                        </div>
                        
                        {alert.affected_area_percentage && (
                          <div>
                            <span className="text-muted-foreground">Affected Area:</span>
                            <div>{alert.affected_area_percentage.toFixed(1)}%</div>
                          </div>
                        )}
                        
                        {alert.ndvi_change && (
                          <div>
                            <span className="text-muted-foreground">NDVI Change:</span>
                            <div className={alert.ndvi_change < 0 ? 'text-red-600' : 'text-green-600'}>
                              {alert.ndvi_change > 0 ? '+' : ''}{alert.ndvi_change.toFixed(3)}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="capitalize">{alert.status}</div>
                        </div>
                      </div>

                      {/* Trigger Values */}
                      {alert.trigger_values && Object.keys(alert.trigger_values).length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Trigger Values:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(alert.trigger_values).map(([key, value]: [string, any]) => (
                              <div key={key}>
                                <span className="text-muted-foreground capitalize">
                                  {key.replace('_', ' ')}:
                                </span>
                                <span className="ml-1">
                                  {typeof value === 'number' ? value.toFixed(3) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {alert.recommendations && alert.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Recommendations:</p>
                          <ul className="text-sm space-y-1">
                            {alert.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {alert.status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Alert */}
      {alertStats.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{alertStats.critical} critical alert{alertStats.critical > 1 ? 's' : ''}</strong> require immediate attention. 
            Review the satellite data and take appropriate action to prevent crop damage.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SatelliteAlerts;