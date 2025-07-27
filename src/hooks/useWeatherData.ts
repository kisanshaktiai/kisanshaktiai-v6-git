
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
  observation_time: string;
  latitude: number;
  longitude: number;
}

export const useWeatherData = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location } = useSelector((state: RootState) => state.farmer);

  const fetchWeatherData = async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // First, try to get recent weather data from database
      const { data: recentWeather } = await supabase
        .from('weather_current')
        .select('*')
        .eq('latitude', location.latitude)
        .eq('longitude', location.longitude)
        .gte('observation_time', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 minutes
        .order('observation_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentWeather) {
        setCurrentWeather(recentWeather);
        setLoading(false);
      } else {
        // Fetch fresh data using the weather-sync edge function
        const { data: syncResult, error: syncError } = await supabase.functions.invoke('weather-sync', {
          body: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        });

        if (syncError) {
          console.error('Weather sync error:', syncError);
          setError('Failed to fetch weather data');
        } else if (syncResult?.weather_data) {
          const weatherData = {
            id: 'current',
            temperature_celsius: syncResult.weather_data.temperature,
            feels_like_celsius: syncResult.weather_data.feelsLike,
            humidity_percent: syncResult.weather_data.humidity,
            weather_main: syncResult.weather_data.weatherMain,
            weather_description: syncResult.weather_data.weatherDescription,
            weather_icon: syncResult.weather_data.weatherIcon,
            wind_speed_kmh: syncResult.weather_data.windSpeed,
            observation_time: new Date().toISOString(),
            latitude: location.latitude,
            longitude: location.longitude
          };
          setCurrentWeather(weatherData);
        }
        
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const refreshWeather = async () => {
    setLoading(true);
    await fetchWeatherData();
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Set up auto-refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [location]);

  return {
    currentWeather,
    loading,
    error,
    refreshWeather
  };
};
