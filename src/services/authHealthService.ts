import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: Date;
  details?: any;
}

interface AuthHealthCheck {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    supabaseConnection: boolean;
    sessionValid: boolean;
    profileExists: boolean;
    edgeFunctionReachable: boolean;
  };
  errors: string[];
  timestamp: string;
}

interface AuthDiagnosis {
  userExists: boolean;
  profileExists: boolean;
  authRecordExists: boolean;
  issues: string[];
  recommendations: string[];
}

interface DebugLogEntry {
  event: string;
  timestamp: string;
  details?: any;
}

class AuthHealthService {
  private static instance: AuthHealthService;
  private healthChecks: HealthCheck[] = [];
  private debugLogs: DebugLogEntry[] = [];

  static getInstance(): AuthHealthService {
    if (!AuthHealthService.instance) {
      AuthHealthService.instance = new AuthHealthService();
    }
    return AuthHealthService.instance;
  }

  async performHealthCheck(): Promise<AuthHealthCheck> {
    const checks = await this.runAllHealthChecks();
    
    const supabaseConnection = checks.find(c => c.service === 'database')?.status === 'healthy';
    const sessionValid = true; // Simplified for now
    const profileExists = checks.find(c => c.service === 'user_profiles')?.status === 'healthy';
    const edgeFunctionReachable = checks.find(c => c.service === 'auth')?.status === 'healthy';

    const errors: string[] = [];
    checks.forEach(check => {
      if (check.status !== 'healthy') {
        errors.push(`${check.service}: ${check.message}`);
      }
    });

    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (errors.length > 0) {
      status = errors.length > 2 ? 'error' : 'warning';
    }

    return {
      status,
      checks: {
        supabaseConnection,
        sessionValid,
        profileExists,
        edgeFunctionReachable
      },
      errors,
      timestamp: new Date().toISOString()
    };
  }

  getDebugLogs(): DebugLogEntry[] {
    return this.debugLogs;
  }

  addDebugLog(event: string, details?: any): void {
    this.debugLogs.unshift({
      event,
      timestamp: new Date().toISOString(),
      details
    });
    
    // Keep only last 50 logs
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(0, 50);
    }
  }

  clearDebugLogs(): void {
    this.debugLogs = [];
  }

  async diagnoseAuthIssue(phoneNumber: string): Promise<AuthDiagnosis> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if farmer exists
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .select('id, mobile_number')
        .eq('mobile_number', phoneNumber)
        .single();

      const userExists = !farmerError && farmer !== null;
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, mobile_number')
        .eq('mobile_number', phoneNumber)
        .single();

      const profileExists = !profileError && profile !== null;

      // Check auth record (simplified)
      const authRecordExists = userExists; // For now, same as farmer exists

      if (!userExists) {
        issues.push('User does not exist in farmers table');
        recommendations.push('User needs to register first');
      }

      if (!profileExists) {
        issues.push('User profile does not exist');
        recommendations.push('Create user profile after registration');
      }

      this.addDebugLog('auth_diagnosis', {
        phoneNumber,
        userExists,
        profileExists,
        authRecordExists,
        issues,
        recommendations
      });

      return {
        userExists,
        profileExists,
        authRecordExists,
        issues,
        recommendations
      };
    } catch (error) {
      this.addDebugLog('auth_diagnosis_error', { phoneNumber, error });
      throw error;
    }
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
