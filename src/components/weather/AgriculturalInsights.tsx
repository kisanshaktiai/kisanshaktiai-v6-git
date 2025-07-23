import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Sun, 
  Sprout, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useStubData } from '@/hooks/useStubData';

interface WeatherData {
  temperature_celsius: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  rain_24h_mm: number;
  uv_index: number;
  soil_moisture_percent?: number;
  evapotranspiration_mm?: number;
  growing_degree_days?: number;
}

interface AgriculturalInsightsProps {
  weather: WeatherData;
  detailed?: boolean;
}

export const AgriculturalInsights: React.FC<AgriculturalInsightsProps> = ({ 
  weather, 
  detailed = false 
}) => {
  const { t } = useTranslation();
  const { farmer } = useStubData();

  const getTemperatureInsight = () => {
    if (weather.temperature_celsius > 35) {
      return {
        type: 'warning',
        icon: AlertTriangle,
        title: 'High Temperature Alert',
        message: 'Consider additional irrigation and shade protection for crops'
      };
    } else if (weather.temperature_celsius < 10) {
      return {
        type: 'warning',
        icon: AlertTriangle,
        title: 'Low Temperature Alert',
        message: 'Protect sensitive crops from cold damage'
      };
    }
    return {
      type: 'success',
      icon: CheckCircle,
      title: 'Optimal Temperature',
      message: 'Temperature conditions are favorable for crop growth'
    };
  };

  const getHumidityInsight = () => {
    if (weather.humidity_percent > 80) {
      return {
        type: 'warning',
        icon: AlertTriangle,
        title: 'High Humidity',
        message: 'Monitor for fungal diseases and improve ventilation'
      };
    } else if (weather.humidity_percent < 30) {
      return {
        type: 'info',
        icon: Info,
        title: 'Low Humidity',
        message: 'Consider increasing irrigation frequency'
      };
    }
    return {
      type: 'success',
      icon: CheckCircle,
      title: 'Good Humidity',
      message: 'Humidity levels are suitable for most crops'
    };
  };

  const getWindInsight = () => {
    if (weather.wind_speed_kmh > 25) {
      return {
        type: 'warning',
        icon: AlertTriangle,
        title: 'High Wind Speed',
        message: 'Secure loose structures and check for crop damage'
      };
    }
    return {
      type: 'success',
      icon: CheckCircle,
      title: 'Calm Conditions',
      message: 'Good conditions for spraying and field operations'
    };
  };

  const insights = [
    getTemperatureInsight(),
    getHumidityInsight(),
    getWindInsight()
  ];

  const getCurrentConditions = () => [
    {
      label: 'Temperature',
      value: `${weather.temperature_celsius}°C`,
      icon: Thermometer,
      color: 'text-red-500'
    },
    {
      label: 'Humidity',
      value: `${weather.humidity_percent}%`,
      icon: Droplets,
      color: 'text-blue-500'
    },
    {
      label: 'Wind Speed',
      value: `${weather.wind_speed_kmh} km/h`,
      icon: Wind,
      color: 'text-gray-500'
    },
    {
      label: 'UV Index',
      value: weather.uv_index?.toString() || 'N/A',
      icon: Sun,
      color: 'text-yellow-500'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sprout className="w-5 h-5 mr-2 text-green-600" />
            Agricultural Insights for {farmer.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Location: {farmer.village}, {farmer.district}
          </p>
          
          {/* Current Conditions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {getCurrentConditions().map((condition, index) => {
              const Icon = condition.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${condition.color}`} />
                  <p className="text-xs text-gray-600">{condition.label}</p>
                  <p className="font-semibold">{condition.value}</p>
                </div>
              );
            })}
          </div>

          {/* Insights */}
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Alert key={index} className={
                  insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  insight.type === 'success' ? 'border-green-200 bg-green-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <Icon className={`h-4 w-4 ${
                    insight.type === 'warning' ? 'text-yellow-600' :
                    insight.type === 'success' ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <AlertDescription>
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm mt-1">{insight.message}</div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>

          {detailed && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium">Detailed Recommendations</h4>
              <div className="grid gap-3">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm">Irrigation Schedule</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    Based on current weather, water early morning or late evening
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm">Pest Management</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    Monitor for increased pest activity in current conditions
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm">Field Operations</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    Good conditions for field work between 7 AM - 10 AM
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
