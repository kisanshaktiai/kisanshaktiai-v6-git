import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Thermometer, 
  Wind, 
  CloudRain, 
  Droplets,
  Sun,
  Snowflake,
  Shield
} from 'lucide-react';

interface WeatherAlert {
  id: string;
  event_type: string;
  severity: string;
  urgency: string;
  title: string;
  description: string;
  crop_impact_level: string;
  affected_activities: string[];
  recommendations: string[];
  start_time: string;
  end_time: string;
}

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ alerts }) => {
  const { t } = useTranslation();

  const getAlertIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'frost':
        return <Snowflake className="w-5 h-5" />;
      case 'heat':
        return <Sun className="w-5 h-5" />;
      case 'wind':
        return <Wind className="w-5 h-5" />;
      case 'rain':
        return <CloudRain className="w-5 h-5" />;
      case 'humidity':
        return <Droplets className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'extreme':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impactLevel: string) => {
    switch (impactLevel?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityName = (activity: string) => {
    const activityNames: { [key: string]: string } = {
      'spraying': t('activities.spraying', 'Spraying'),
      'harvesting': t('activities.harvesting', 'Harvesting'),
      'sowing': t('activities.sowing', 'Sowing'),
      'irrigation': t('activities.irrigation', 'Irrigation'),
      'fertilizing': t('activities.fertilizing', 'Fertilizing'),
      'field_work': t('activities.fieldWork', 'Field Work'),
      'drone_operations': t('activities.droneOps', 'Drone Operations'),
      'disease_monitoring': t('activities.diseaseMonitoring', 'Disease Monitoring'),
      'watering': t('activities.watering', 'Watering')
    };
    return activityNames[activity] || activity;
  };

  if (alerts.length === 0) {
    return null;
  }

  // Sort alerts by severity and start time
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { 'extreme': 4, 'severe': 3, 'moderate': 2, 'minor': 1 };
    const aSeverity = severityOrder[a.severity.toLowerCase() as keyof typeof severityOrder] || 0;
    const bSeverity = severityOrder[b.severity.toLowerCase() as keyof typeof severityOrder] || 0;
    
    if (aSeverity !== bSeverity) {
      return bSeverity - aSeverity; // Higher severity first
    }
    
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <Shield className="w-5 h-5" />
          <span>{t('weather.activeAlerts', 'Active Weather Alerts')}</span>
          <Badge variant="secondary" className="bg-orange-200 text-orange-800">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedAlerts.map((alert) => (
          <Alert 
            key={alert.id} 
            className={`${getSeverityColor(alert.severity)} border-l-4`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getAlertIcon(alert.event_type)}
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <AlertTitle className="text-base font-semibold">
                      {alert.title}
                    </AlertTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {alert.crop_impact_level && (
                        <Badge variant="outline" className={getImpactColor(alert.crop_impact_level)}>
                          {alert.crop_impact_level.toUpperCase()} {t('weather.impact', 'Impact')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-600">
                    <div>{formatDateTime(alert.start_time)}</div>
                    {alert.end_time && (
                      <div className="text-xs">
                        {t('weather.until', 'Until')} {formatDateTime(alert.end_time)}
                      </div>
                    )}
                  </div>
                </div>

                <AlertDescription className="text-sm">
                  {alert.description}
                </AlertDescription>

                {/* Affected Activities */}
                {alert.affected_activities && alert.affected_activities.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {t('weather.affectedActivities', 'Affected Activities')}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {alert.affected_activities.map((activity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {getActivityName(activity)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {alert.recommendations && alert.recommendations.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {t('weather.recommendations', 'Recommendations')}:
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {alert.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};