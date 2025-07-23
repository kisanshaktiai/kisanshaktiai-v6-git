import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: any;
}

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: any;
}

class AuthHealthService {
  private static instance: AuthHealthService;
  private debugLogs: DebugLog[] = [];

  static getInstance(): AuthHealthService {
    if (!AuthHealthService.instance) {
      AuthHealthService.instance = new AuthHealthService();
    }
    return AuthHealthService.instance;
  }

  private addDebugLog(level: 'info' | 'warn' | 'error', message: string, context?: any) {
    this.debugLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    });
    
    // Keep only last 100 logs
    if (this.debugLogs.length > 100) {
      this.debugLogs = this.debugLogs.slice(-100);
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    return await this.checkAuthHealth();
  }

  getDebugLogs(): DebugLog[] {
    return [...this.debugLogs];
  }

  clearDebugLogs(): void {
    this.debugLogs = [];
  }

  async diagnoseAuthIssue(mobileNumber: string): Promise<{
    farmerExists: boolean;
    profileExists: boolean;
    recommendations: string[];
  }> {
    const farmerExists = await this.checkFarmerExists(mobileNumber);
    const profileExists = await this.checkProfileExists(mobileNumber);
    
    const recommendations: string[] = [];
    
    if (!farmerExists) {
      recommendations.push('Farmer record not found. User needs to register.');
    }
    
    if (!profileExists) {
      recommendations.push('Profile not found. Profile completion required.');
    }
    
    if (farmerExists && profileExists) {
      recommendations.push('Both farmer and profile exist. Check authentication flow.');
    }
    
    return {
      farmerExists,
      profileExists,
      recommendations
    };
  }

  async checkAuthHealth(): Promise<HealthCheckResult> {
    try {
      this.addDebugLog('info', 'Starting auth health check');
      
      // Check if we can get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        this.addDebugLog('error', 'Failed to get session', sessionError);
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
        this.addDebugLog('error', 'Failed to query farmers table', farmersError);
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
        this.addDebugLog('error', 'Failed to query user_profiles table', profilesError);
        return {
          status: 'unhealthy',
          message: 'Failed to query user_profiles table',
          details: profilesError
        };
      }

      this.addDebugLog('info', 'Auth health check completed successfully');
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
      this.addDebugLog('error', 'Auth health check failed', error);
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
        this.addDebugLog('error', 'Error checking farmer existence', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      this.addDebugLog('error', 'Error in checkFarmerExists', error);
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
        this.addDebugLog('error', 'Error checking profile existence', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      this.addDebugLog('error', 'Error in checkProfileExists', error);
      return false;
    }
  }
}

export const authHealthService = AuthHealthService.getInstance();
