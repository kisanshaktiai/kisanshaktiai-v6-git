
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: any;
}

class AuthHealthService {
  private static instance: AuthHealthService;

  static getInstance(): AuthHealthService {
    if (!AuthHealthService.instance) {
      AuthHealthService.instance = new AuthHealthService();
    }
    return AuthHealthService.instance;
  }

  async checkAuthHealth(): Promise<HealthCheckResult> {
    try {
      // Check if we can get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return {
          status: 'unhealthy',
          message: 'Failed to get session',
          details: sessionError
        };
      }

      // Check if we can query the farmers table
      const { data: farmersData, error: farmersError } = await supabase
        .from('farmers')
        .select('id, mobile_number')
        .limit(1);

      if (farmersError) {
        return {
          status: 'unhealthy',
          message: 'Failed to query farmers table',
          details: farmersError
        };
      }

      // Check if we can query the user_profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, mobile_number')
        .limit(1);

      if (profilesError) {
        return {
          status: 'unhealthy',
          message: 'Failed to query user_profiles table',
          details: profilesError
        };
      }

      return {
        status: 'healthy',
        message: 'Authentication system is healthy',
        details: {
          session: !!session,
          farmersCount: farmersData?.length || 0,
          profilesCount: profilesData?.length || 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Authentication health check failed',
        details: error
      };
    }
  }

  async checkFarmerExists(mobileNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', mobileNumber)
        .limit(1);

      if (error) {
        console.error('Error checking farmer existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkFarmerExists:', error);
      return false;
    }
  }

  async checkProfileExists(mobileNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('mobile_number', mobileNumber)
        .limit(1);

      if (error) {
        console.error('Error checking profile existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkProfileExists:', error);
      return false;
    }
  }
}

export const authHealthService = AuthHealthService.getInstance();
