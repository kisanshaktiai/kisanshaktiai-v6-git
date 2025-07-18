
import { supabase } from '@/integrations/supabase/client';
import { customAuthService } from './customAuthService';

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

export class AuthHealthService {
  private static instance: AuthHealthService;

  static getInstance(): AuthHealthService {
    if (!AuthHealthService.instance) {
      AuthHealthService.instance = new AuthHealthService();
    }
    return AuthHealthService.instance;
  }

  /**
   * Perform comprehensive authentication health check
   */
  async performHealthCheck(): Promise<AuthHealthCheck> {
    const healthCheck: AuthHealthCheck = {
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

    // Test Supabase connection
    try {
      const { data, error } = await supabase.from('farmers').select('count').limit(1);
      if (error) throw error;
      healthCheck.checks.supabaseConnection = true;
    } catch (error) {
      healthCheck.errors.push(`Supabase connection failed: ${error}`);
      healthCheck.status = 'error';
    }

    // Test current session validity using custom auth
    try {
      const isAuthenticated = customAuthService.isAuthenticated();
      const farmer = customAuthService.getCurrentFarmer();
      
      healthCheck.checks.sessionValid = isAuthenticated;
      healthCheck.checks.profileExists = !!farmer;
      
      if (!isAuthenticated) {
        healthCheck.errors.push('No valid authentication session');
        healthCheck.status = 'warning';
      }
      
      if (!farmer && isAuthenticated) {
        healthCheck.errors.push('Authenticated but no farmer profile found');
        healthCheck.status = 'warning';
      }
    } catch (error) {
      healthCheck.errors.push(`Session check failed: ${error}`);
      healthCheck.status = 'error';
    }

    // Test edge function reachability
    try {
      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: { mobile_number: '0000000000', pin: '0000' }
      });
      
      // We expect this to fail, but if it reaches the function, that's good
      healthCheck.checks.edgeFunctionReachable = true;
      
      if (error && !error.message.includes('Please enter a valid')) {
        healthCheck.errors.push(`Edge function test failed: ${error.message}`);
        healthCheck.status = 'warning';
      }
    } catch (error) {
      healthCheck.errors.push(`Edge function reachability test failed: ${error}`);
      healthCheck.status = 'warning';
    }

    console.log('Auth health check completed:', healthCheck);
    return healthCheck;
  }

  /**
   * Diagnose specific authentication issues
   */
  async diagnoseAuthIssue(phone: string): Promise<{
    userExists: boolean;
    profileExists: boolean;
    authRecordExists: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const diagnosis = {
      userExists: false,
      profileExists: false,
      authRecordExists: false,
      issues: [],
      recommendations: []
    };

    try {
      const cleanPhone = phone.replace(/\D/g, '');

      // Check if farmer profile exists
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id, mobile_number')
        .eq('mobile_number', cleanPhone)
        .single();

      diagnosis.profileExists = !!farmer;
      diagnosis.userExists = !!farmer;
      diagnosis.authRecordExists = !!farmer; // In our custom auth, profile = auth record

      if (!farmer) {
        diagnosis.issues.push('Farmer profile not found');
        diagnosis.recommendations.push('User needs to complete registration');
      }

      // Test edge function with this phone number
      try {
        const { data, error } = await supabase.functions.invoke('custom-auth-login', {
          body: { mobile_number: cleanPhone, pin: '0000' }
        });

        if (error && !error.message.includes('No account found')) {
          diagnosis.issues.push(`Edge function error: ${error.message}`);
          diagnosis.recommendations.push('Check network connectivity and try again');
        }
      } catch (error) {
        diagnosis.issues.push('Edge function unreachable');
        diagnosis.recommendations.push('Service may be temporarily unavailable');
      }

    } catch (error) {
      diagnosis.issues.push(`Diagnosis failed: ${error}`);
      diagnosis.recommendations.push('Contact support for assistance');
    }

    return diagnosis;
  }

  /**
   * Log authentication event for debugging
   */
  async logAuthEvent(event: string, details: any): Promise<void> {
    try {
      const logEntry = {
        event,
        details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      };

      console.log('Auth Event:', logEntry);

      // Store in local storage for debugging (last 50 events)
      const logs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
      logs.unshift(logEntry);
      if (logs.length > 50) logs.splice(50);
      localStorage.setItem('auth_debug_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging auth event:', error);
    }
  }

  /**
   * Get recent authentication debug logs
   */
  getDebugLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
    } catch (error) {
      console.error('Error retrieving debug logs:', error);
      return [];
    }
  }

  /**
   * Clear all debug logs
   */
  clearDebugLogs(): void {
    try {
      localStorage.removeItem('auth_debug_logs');
    } catch (error) {
      console.error('Error clearing debug logs:', error);
    }
  }
}

export const authHealthService = AuthHealthService.getInstance();
