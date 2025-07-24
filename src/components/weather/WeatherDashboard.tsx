import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrentWeatherCard } from './CurrentWeatherCard';
import { WeatherForecast } from './WeatherForecast';
import { WeatherAlerts } from './WeatherAlerts';
import { AgriculturalInsights } from './AgriculturalInsights';
import { WeatherSettings } from './WeatherSettings';
import { RefreshCw, Settings, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeatherData {
  id: string;
  temperature_celsius: number;
  feels_like_celsius: number;
  humidity_percent: number;
  pressure_hpa: number;
  wind_speed_kmh: number;
  wind_direction_degrees: number;
  visibility_km: number;
  uv_index: number;
  rain_1h_mm: number;
  rain_24h_mm: number;
  cloud_cover_percent: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  sunrise: string;
  sunset: string;
  moon_phase: number;
  evapotranspiration_mm: number;
  soil_temperature_celsius: number;
  soil_moisture_percent: number;
  growing_degree_days: number;
  observation_time: string;
}

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

export const WeatherDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { location, profile } = useSelector((state: RootState) => state.farmer);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetchWeatherData = async () => {
    if (!location) return;

    try {
      // Get current weather
      const { data: weather, error: weatherError } = await supabase
        .from('weather_current')
        .select('*')
        .eq('latitude', location.latitude)
        .eq('longitude', location.longitude)
        .order('observation_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weather) {
        setCurrentWeather(weather);
      }

      // Get active alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('latitude', location.latitude)
        .eq('longitude', location.longitude)
        .eq('is_active', true)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: false });

      if (alertsData) {
        setAlerts(alertsData);
      }

      if (weatherError) console.error('Weather fetch error:', weatherError);
      if (alertsError) console.error('Alerts fetch error:', alertsError);

    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshWeatherData = async () => {
    if (!location) return;
    
    setRefreshing(true);
    
    try {
      // Call weather sync function
      const { data, error } = await supabase.functions.invoke('weather-sync', {
        body: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      if (error) {
        console.error('Weather sync error:', error);
      } else {
        console.log('Weather sync successful:', data);
        // Refresh local data
        await fetchWeatherData();
      }
    } catch (error) {
      console.error('Error refreshing weather:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Set up auto-refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [location]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('weather.locationRequired', 'Location Required')}
          </h3>
          <p className="text-gray-600">
            {t('weather.enableLocation', 'Please enable location access to view weather data')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('weather.dashboard', 'Weather Dashboard')}
          </h2>
          <p className="text-gray-600">
            {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshWeatherData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('weather.refresh', 'Refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t('weather.settings', 'Settings')}
          </Button>
        </div>
      </div>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <WeatherAlerts alerts={alerts} />
      )}

      {/* Weather Settings */}
      {showSettings && (
        <WeatherSettings 
          farmerId={profile?.id || ''}
          location={location}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">{t('weather.current', 'Current')}</TabsTrigger>
          <TabsTrigger value="forecast">{t('weather.forecast', 'Forecast')}</TabsTrigger>
          <TabsTrigger value="insights">{t('weather.insights', 'Insights')}</TabsTrigger>
          <TabsTrigger value="history">{t('weather.history', 'History')}</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {currentWeather && (
            <>
              <CurrentWeatherCard weather={currentWeather} />
              <AgriculturalInsights weather={currentWeather} />
            </>
          )}
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <WeatherForecast 
            latitude={location.latitude}
            longitude={location.longitude}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {currentWeather && (
            <AgriculturalInsights 
              weather={currentWeather}
              detailed={true}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('weather.historicalData', 'Historical Weather Data')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {t('weather.historicalComingSoon', 'Historical weather analysis coming soon')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};