import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
  id: string;
  temperature_celsius: number;
  feels_like_celsius: number;
  humidity_percent: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  wind_speed_kmh: number;
  rain_1h_mm?: number;
  observation_time: string;
  latitude: number;
  longitude: number;
  data_source?: string;
}

export const useEnhancedWeatherData = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const { location } = useSelector((state: RootState) => state.farmer);

  const fetchWeatherData = async (forceRefresh = false) => {
    if (!location) {
      console.log('No location available for weather fetch');
      setError('Location not available');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching weather data for:', location);

      // Check for recent data if not forcing refresh
      if (!forceRefresh) {
        const { data: recentWeather, error: dbError } = await supabase
          .from('weather_current')
          .select('*')
          .eq('latitude', location.latitude)
          .eq('longitude', location.longitude)
          .gte('observation_time', new Date(Date.now() - 15 * 60 * 1000).toISOString())
          .order('observation_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbError) {
          console.error('Database query error:', dbError);
        }

        if (recentWeather && !dbError) {
          console.log('Using recent weather data from DB:', recentWeather);
          setCurrentWeather(recentWeather);
          setLastFetch(new Date());
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data using edge function
      console.log('Fetching fresh weather data via edge function');
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('weather-sync', {
        body: {
          latitude: location.latitude,
          longitude: location.longitude,
          use_tomorrow_io: true,
          force_refresh: forceRefresh
        }
      });

      console.log('Edge function response:', { syncResult, syncError });

      if (syncError) {
        console.error('Weather sync error:', syncError);
        throw new Error(`Weather sync failed: ${syncError.message}`);
      }

      if (syncResult?.weather_data) {
        const weatherData: WeatherData = {
          id: 'current',
          temperature_celsius: syncResult.weather_data.temperature,
          feels_like_celsius: syncResult.weather_data.feelsLike,
          humidity_percent: syncResult.weather_data.humidity,
          weather_main: syncResult.weather_data.weatherMain,
          weather_description: syncResult.weather_data.weatherDescription,
          weather_icon: syncResult.weather_data.weatherIcon,
          wind_speed_kmh: syncResult.weather_data.windSpeed,
          rain_1h_mm: syncResult.weather_data.rain_1h_mm || 0,
          observation_time: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          data_source: syncResult.data_source
        };
        
        console.log('Weather data processed:', weatherData);
        setCurrentWeather(weatherData);
        setLastFetch(new Date());
      } else {
        throw new Error('No weather data received');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setLoading(false);
    }
  };

  const refreshWeather = async () => {
    console.log('Manual weather refresh requested');
    setLoading(true);
    await fetchWeatherData(true);
  };

  useEffect(() => {
    if (location) {
      console.log('Location changed, fetching weather data');
      fetchWeatherData();
    }
  }, [location]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!location) return;
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing weather data');
      fetchWeatherData();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [location]);

  return {
    currentWeather,
    loading,
    error,
    lastFetch,
    refreshWeather,
    hasLocation: !!location
  };
};
