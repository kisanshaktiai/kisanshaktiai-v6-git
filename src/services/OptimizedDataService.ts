
import { supabase } from '@/integrations/supabase/client';

export class OptimizedDataService {
  private static instance: OptimizedDataService;

  static getInstance(): OptimizedDataService {
    if (!OptimizedDataService.instance) {
      OptimizedDataService.instance = new OptimizedDataService();
    }
    return OptimizedDataService.instance;
  }

  // Fast dashboard data via edge function
  async getDashboardData() {
    try {
      const { data, error } = await supabase.functions.invoke('dashboard-data');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Dashboard data error:', error);
      throw error;
    }
  }

  // Fast land summary via edge function
  async getLandsSummary(landId?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('land-summary', {
        body: landId ? { landId } : {}
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Land summary error:', error);
      throw error;
    }
  }

  // Fast farmer profile via edge function
  async getFarmerProfile() {
    try {
      const { data, error } = await supabase.functions.invoke('farmer-profile');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Farmer profile error:', error);
      throw error;
    }
  }

  // Optimized weather data (using existing edge function)
  async getWeatherData(latitude: number, longitude: number, forceRefresh = false) {
    try {
      const { data, error } = await supabase.functions.invoke('weather-sync', {
        body: {
          latitude,
          longitude,
          use_tomorrow_io: true,
          force_refresh: forceRefresh
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Weather data error:', error);
      throw error;
    }
  }

  // Batch operations for better performance
  async batchUpdateLandActivities(activities: any[]) {
    try {
      const { data, error } = await supabase
        .from('land_activities')
        .upsert(activities, { onConflict: 'id' });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Batch update error:', error);
      throw error;
    }
  }
}

export const optimizedDataService = OptimizedDataService.getInstance();
