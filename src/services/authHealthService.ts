
import { supabase } from '@/integrations/supabase/client';

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

interface DiagnosisResult {
  userExists: boolean;
  authRecordExists: boolean;
  farmerExists: boolean;
  profileExists: boolean;
  issues: string[];
  recommendations: string[];
}

interface HealthCheckResult {
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

  private addDebugLog(level: 'info' | 'warn' | 'error', message: string, context?: any): void {
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
    const result: HealthCheckResult = {
      status: 'healthy',
      checks: {
        supabaseConnection: false,
        sessionValid: false,
        profileExists: false,
        edgeFunctionReachable: false
      },
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Test Supabase connection
      const { error: connectionError } = await supabase.from('farmers').select('count').limit(1);
      result.checks.supabaseConnection = !connectionError;
      if (connectionError) {
        result.errors.push(`Supabase connection failed: ${connectionError.message}`);
        this.addDebugLog('error', 'Supabase connection failed', connectionError);
      }

      // Test session validity
      const { data: { session } } = await supabase.auth.getSession();
      result.checks.sessionValid = !!session;
      if (!session) {
        result.errors.push('No active session found');
        this.addDebugLog('warn', 'No active session found');
      }

      // Test profile existence
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        result.checks.profileExists = !!profile && !profileError;
        if (profileError) {
          result.errors.push(`Profile check failed: ${profileError.message}`);
          this.addDebugLog('error', 'Profile check failed', profileError);
        }
      }

      // Test edge function reachability (simplified check)
      result.checks.edgeFunctionReachable = result.checks.supabaseConnection;

      // Determine overall status
      if (result.errors.length === 0) {
        result.status = 'healthy';
      } else if (result.checks.supabaseConnection) {
        result.status = 'warning';
      } else {
        result.status = 'error';
      }

      this.addDebugLog('info', 'Health check completed', result);
    } catch (error) {
      result.status = 'error';
      result.errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.addDebugLog('error', 'Health check failed', error);
    }

    return result;
  }

  async diagnoseAuthIssue(mobileNumber: string): Promise<DiagnosisResult> {
    const result: DiagnosisResult = {
      userExists: false,
      authRecordExists: false,
      farmerExists: false,
      profileExists: false,
      issues: [],
      recommendations: []
    };

    try {
      // Check if farmer exists
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .select('id, mobile_number')
        .eq('mobile_number', mobileNumber)
        .maybeSingle();

      if (farmerError) {
        result.issues.push(`Error checking farmer: ${farmerError.message}`);
        this.addDebugLog('error', 'Error checking farmer', farmerError);
      } else {
        result.farmerExists = !!farmer;
        result.userExists = !!farmer;
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, mobile_number')
        .eq('mobile_number', mobileNumber)
        .maybeSingle();

      if (profileError) {
        result.issues.push(`Error checking profile: ${profileError.message}`);
        this.addDebugLog('error', 'Error checking profile', profileError);
      } else {
        result.profileExists = !!profile;
      }

      // Generate recommendations
      if (!result.farmerExists) {
        result.recommendations.push('User needs to register as farmer first');
      }
      if (!result.profileExists) {
        result.recommendations.push('User profile needs to be created');
      }
      if (result.farmerExists && result.profileExists) {
        result.recommendations.push('User data exists - check authentication flow');
      }

      this.addDebugLog('info', 'Diagnosis completed', result);
    } catch (error) {
      result.issues.push(`Diagnosis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.addDebugLog('error', 'Diagnosis failed', error);
    }

    return result;
  }

  getDebugLogs(): DebugLog[] {
    return [...this.debugLogs];
  }

  clearDebugLogs(): void {
    this.debugLogs = [];
    this.addDebugLog('info', 'Debug logs cleared');
  }
}

export const authHealthService = AuthHealthService.getInstance();
export type { AuthHealthCheck, DiagnosisResult, HealthCheckResult, DebugLog };
