
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: Date;
  details?: any;
}

class AuthHealthService {
  private static instance: AuthHealthService;
  private healthChecks: HealthCheck[] = [];

  static getInstance(): AuthHealthService {
    if (!AuthHealthService.instance) {
      AuthHealthService.instance = new AuthHealthService();
    }
    return AuthHealthService.instance;
  }

  async checkDatabaseHealth(): Promise<HealthCheck> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .limit(1);

      if (error) throw error;

      return {
        service: 'database',
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: new Date(),
        details: { recordsAccessible: data ? data.length : 0 }
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date(),
        details: { error }
      };
    }
  }

  async checkAuthServiceHealth(): Promise<HealthCheck> {
    try {
      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: '0000000000',
          pin: '0000',
          test: true
        }
      });

      // Even if registration fails, if we get a response, the service is up
      return {
        service: 'auth',
        status: 'healthy',
        message: 'Auth service is responding',
        timestamp: new Date(),
        details: { responsive: true }
      };
    } catch (error) {
      return {
        service: 'auth',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Auth service unavailable',
        timestamp: new Date(),
        details: { error }
      };
    }
  }

  async checkUserProfilesHealth(): Promise<HealthCheck> {
    try {
      // Check if user_profiles table exists and is accessible
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error) throw error;

      return {
        service: 'user_profiles',
        status: 'healthy',
        message: 'User profiles table accessible',
        timestamp: new Date(),
        details: { accessible: true }
      };
    } catch (error) {
      return {
        service: 'user_profiles',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'User profiles table inaccessible',
        timestamp: new Date(),
        details: { error }
      };
    }
  }

  async checkFarmersTableHealth(): Promise<HealthCheck> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('id, mobile_number')
        .limit(1);

      if (error) throw error;

      return {
        service: 'farmers_table',
        status: 'healthy',
        message: 'Farmers table accessible',
        timestamp: new Date(),
        details: { accessible: true, sampleData: data }
      };
    } catch (error) {
      return {
        service: 'farmers_table',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Farmers table inaccessible',
        timestamp: new Date(),
        details: { error }
      };
    }
  }

  async runAllHealthChecks(): Promise<HealthCheck[]> {
    const checks = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkAuthServiceHealth(),
      this.checkUserProfilesHealth(),
      this.checkFarmersTableHealth()
    ]);

    this.healthChecks = checks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        service: 'unknown',
        status: 'unhealthy' as const,
        message: 'Health check failed',
        timestamp: new Date(),
        details: { reason: result.reason }
      }
    );

    return this.healthChecks;
  }

  getLastHealthChecks(): HealthCheck[] {
    return this.healthChecks;
  }

  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    if (this.healthChecks.length === 0) return 'unhealthy';
    
    const healthyCount = this.healthChecks.filter(check => check.status === 'healthy').length;
    const totalCount = this.healthChecks.length;
    
    if (healthyCount === totalCount) return 'healthy';
    if (healthyCount > totalCount / 2) return 'degraded';
    return 'unhealthy';
  }
}

export const authHealthService = AuthHealthService.getInstance();
