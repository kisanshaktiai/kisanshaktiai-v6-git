
import { supabase } from '@/integrations/supabase/client';

export class OptimizedDataService {
  private static instance: OptimizedDataService;

  static getInstance(): OptimizedDataService {
    if (!OptimizedDataService.instance) {
      OptimizedDataService.instance = new OptimizedDataService();
    }
    return OptimizedDataService.instance;
  }

  // Fast dashboard data via edge function with fallback
  async getDashboardData() {
    try {
      console.log('Fetching dashboard data...');
      const { data, error } = await supabase.functions.invoke('dashboard-data');
      
      if (error) {
        console.error('Edge function error:', error);
        // Return mock data if edge function fails
        return this.getMockDashboardData();
      }
      
      console.log('Dashboard data received:', data);
      return data || this.getMockDashboardData();
    } catch (error) {
      console.error('Dashboard data error:', error);
      // Return mock data as fallback
      return this.getMockDashboardData();
    }
  }

  // Mock data for development/fallback
  private getMockDashboardData() {
    return {
      farmer: {
        id: 'mock-farmer-id',
        total_land_acres: 12.5,
        primary_crops: ['Wheat', 'Rice', 'Cotton'],
        annual_income_range: '5-10 Lakh'
      },
      summary: {
        totalLands: 3,
        totalArea: 12.5,
        activeCrops: 8,
        recentActivities: 5,
        totalIncome: 240000,
        totalExpense: 85000,
        netProfit: 155000,
        weatherAlerts: 2
      },
      lands: [
        {
          id: 'mock-land-1',
          name: 'North Field',
          area_acres: 5.0,
          crop_history: [
            { crop_name: 'Wheat', status: 'active', growth_stage: 'flowering' }
          ]
        },
        {
          id: 'mock-land-2',
          name: 'South Field',
          area_acres: 7.5,
          crop_history: [
            { crop_name: 'Rice', status: 'active', growth_stage: 'vegetative' }
          ]
        }
      ],
      timestamp: new Date().toISOString()
    };
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
