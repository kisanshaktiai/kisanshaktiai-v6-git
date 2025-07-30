
import { useEffect } from 'react';
import { useServiceInitialization } from './useServiceInitialization';
import { GeographicWeatherCache } from '@/services/weather/GeographicWeatherCache';
import { WeatherPredictiveCache } from '@/services/weather/WeatherPredictiveCache';

export const useAdvancedOptimizations = (tenantId?: string, userId?: string) => {
  const services = useServiceInitialization(tenantId, userId);

  useEffect(() => {
    // Initialize weather caching services
    const weatherCache = GeographicWeatherCache.getInstance();
    const predictiveCache = WeatherPredictiveCache.getInstance();
    
    console.log('✅ Advanced optimizations initialized');
  }, [tenantId, userId]);

  return {
    ...services,
    weatherCache: GeographicWeatherCache.getInstance(),
    weatherPredictiveCache: WeatherPredictiveCache.getInstance(),
  };
};
