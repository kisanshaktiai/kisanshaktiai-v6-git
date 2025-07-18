import { supabase } from '@/integrations/supabase/client';
import { sessionService } from './sessionService';

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
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      if (error) throw error;
      healthCheck.checks.supabaseConnection = true;
    } catch (error) {
      healthCheck.errors.push(`Supabase connection failed: ${error}`);
      healthCheck.status = 'error';
    }

    // Test current session validity
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const validation = sessionService.validateSessionData(session);
        healthCheck.checks.sessionValid = validation.isValid;
        if (!validation.isValid) {
          healthCheck.errors.push(`Session validation failed: ${validation.error}`);
          healthCheck.status = 'warning';
        }
      }
    } catch (error) {
      healthCheck.errors.push(`Session check failed: ${error}`);
      healthCheck.status = 'error';
    }

    // Test user profile existence (if session exists)
    if (healthCheck.checks.sessionValid) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
          
          healthCheck.checks.profileExists = !!profile && !error;
          if (!profile && !error) {
            healthCheck.errors.push('User profile not found');
            healthCheck.status = 'warning';
          } else if (error) {
            healthCheck.errors.push(`Profile check failed: ${error.message}`);
            healthCheck.status = 'error';
          }
        }
      } catch (error) {
        healthCheck.errors.push(`Profile existence check failed: ${error}`);
        healthCheck.status = 'error';
      }
    }

    // Test edge function reachability
    try {
      const { data, error } = await supabase.functions.invoke('mobile-auth-check', {
        body: { phone: '0000000000', checkOnly: true }
      });
      
      healthCheck.checks.edgeFunctionReachable = !error;
      if (error) {
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

      // Check if user profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, phone')
        .eq('phone', cleanPhone)
        .maybeSingle();

      diagnosis.profileExists = !!profile;
      diagnosis.userExists = !!profile;

      if (profile) {
        // Check if auth record exists
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
          diagnosis.authRecordExists = !!authUser.user;
        } catch (error) {
          diagnosis.authRecordExists = false;
          diagnosis.issues.push('Auth record missing for existing profile');
          diagnosis.recommendations.push('User may need to re-register');
        }
      } else {
        diagnosis.issues.push('User profile not found');
        diagnosis.recommendations.push('User needs to complete registration');
      }

      // Test edge function with this phone number
      try {
        const { data, error } = await supabase.functions.invoke('mobile-auth-check', {
          body: { phone: cleanPhone, checkOnly: true }
        });

        if (error) {
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
   * Clear debug logs
   */
  clearDebugLogs(): void {
    localStorage.removeItem('auth_debug_logs');
    console.log('Auth debug logs cleared');
  }
}

export const authHealthService = AuthHealthService.getInstance();