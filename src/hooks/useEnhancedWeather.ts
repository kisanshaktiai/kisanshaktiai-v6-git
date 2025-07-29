import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEnhancedWeatherData } from './useEnhancedWeatherData';

interface WeatherPreferences {
  units: 'celsius' | 'fahrenheit';
  notifications: boolean;
  alertThreshold: number;
  locationSharing: boolean;
}

export const useEnhancedWeather = () => {
  const queryClient = useQueryClient();
  const weatherQuery = useEnhancedWeatherData();

  // Weather preferences with React Query
  const preferencesQuery = useQuery({
    queryKey: ['weather-preferences'],
    queryFn: async () => {
      // Fetch from localStorage or API
      const stored = localStorage.getItem('weatherPreferences');
      return stored ? JSON.parse(stored) : {
        units: 'celsius',
        notifications: true,
        alertThreshold: 80,
        locationSharing: true,
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });

  // Optimistic update for weather preferences
  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: Partial<WeatherPreferences>) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      const updated = { ...preferencesQuery.data, ...newPreferences };
      localStorage.setItem('weatherPreferences', JSON.stringify(updated));
      return updated;
    },
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({ queryKey: ['weather-preferences'] });
      const previousPreferences = queryClient.getQueryData(['weather-preferences']);
      
      queryClient.setQueryData(['weather-preferences'], (old: any) => ({
        ...old,
        ...newPreferences,
      }));

      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      queryClient.setQueryData(['weather-preferences'], context?.previousPreferences);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['weather-preferences'] });
    },
  });

  // Weather alerts query with shorter stale time
  const alertsQuery = useQuery({
    queryKey: ['weather-alerts'],
    queryFn: async () => {
      // Fetch weather alerts from API
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - alerts should be fresh
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 3 * 60 * 1000, // Check for new alerts every 3 minutes
    refetchOnWindowFocus: true,
  });

  return {
    weather: weatherQuery,
    preferences: preferencesQuery,
    alerts: alertsQuery,
    updatePreferences: updatePreferences.mutate,
    isUpdatingPreferences: updatePreferences.isPending,
  };
};