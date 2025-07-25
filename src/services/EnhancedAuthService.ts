
import { supabase } from '@/integrations/supabase/client';
import { connectionService } from './ConnectionService';
import { authHealthService } from './authHealthService';

interface AuthResponse {
  success: boolean;
  data?: any;
  error?: string;
  requiresVerification?: boolean;
}

export class EnhancedAuthService {
  private static instance: EnhancedAuthService;

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  /**
   * Enhanced mobile authentication with better error handling
   */
  async authenticateWithMobile(
    phone: string,
    tenantId: string
  ): Promise<AuthResponse> {
    try {
      console.log('Starting enhanced mobile authentication for:', phone);

      // First test the connection
      const connectionTest = await connectionService.testConnection();
      if (!connectionTest.isConnected) {
        return {
          success: false,
          error: 'Cannot connect to servers. Please check your internet connection.',
        };
      }

      // Check if network is healthy
      const networkHealthy = await connectionService.isNetworkHealthy();
      if (!networkHealthy) {
        return {
          success: false,
          error: 'Network connectivity issue detected. Please check your connection.',
        };
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return {
          success: false,
          error: 'Please enter a valid phone number.',
        };
      }

      // Log authentication attempt
      await authHealthService.logAuthEvent('mobile_auth_attempt', {
        phone: cleanPhone,
        tenantId,
        timestamp: new Date().toISOString()
      });

      // Call the mobile auth edge function with enhanced error handling
      const { data, error } = await connectionService.callEdgeFunction(
        'mobile-auth',
        {
          phone: cleanPhone,
          tenant_id: tenantId
        },
        {
          retries: 2,
          timeout: 15000
        }
      );

      if (error) {
        console.error('Mobile auth edge function error:', error);
        
        await authHealthService.logAuthEvent('mobile_auth_error', {
          phone: cleanPhone,
          error,
          tenantId
        });

        // Provide user-friendly error messages
        if (error.includes('timeout')) {
          return {
            success: false,
            error: 'Request timed out. Please try again.',
          };
        } else if (error.includes('Database error')) {
          return {
            success: false,
            error: 'Service temporarily unavailable. Please try again in a few minutes.',
          };
        } else {
          return {
            success: false,
            error: 'Unable to connect to authentication service. Please try again.',
          };
        }
      }

      if (data?.success) {
        await authHealthService.logAuthEvent('mobile_auth_success', {
          phone: cleanPhone,
          tenantId,
          requiresVerification: data.requiresVerification
        });

        return {
          success: true,
          data: data,
          requiresVerification: data.requiresVerification
        };
      }

      return {
        success: false,
        error: data?.error || 'Authentication failed. Please try again.',
      };

    } catch (error) {
      console.error('Enhanced mobile auth error:', error);
      
      await authHealthService.logAuthEvent('mobile_auth_exception', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });

      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Verify OTP with enhanced error handling
   */
  async verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
    try {
      console.log('Starting OTP verification');

      const cleanPhone = phone.replace(/\D/g, '');
      
      // Test connection first
      const connectionTest = await connectionService.testConnection();
      if (!connectionTest.isConnected) {
        return {
          success: false,
          error: 'Cannot connect to servers. Please check your internet connection.',
        };
      }

      const { data, error } = await connectionService.callEdgeFunction(
        'mobile-auth',
        {
          phone: cleanPhone,
          otp: otp,
          action: 'verify'
        },
        {
          retries: 2,
          timeout: 10000
        }
      );

      if (error) {
        console.error('OTP verification error:', error);
        return {
          success: false,
          error: 'Verification failed. Please try again.',
        };
      }

      if (data?.success && data?.session) {
        // Set the session in Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        if (sessionError) {
          console.error('Session setting error:', sessionError);
          return {
            success: false,
            error: 'Failed to establish session. Please try again.',
          };
        }

        await authHealthService.logAuthEvent('otp_verify_success', {
          phone: cleanPhone
        });

        return {
          success: true,
          data: data
        };
      }

      return {
        success: false,
        error: data?.error || 'Invalid verification code. Please try again.',
      };

    } catch (error) {
      console.error('OTP verification exception:', error);
      return {
        success: false,
        error: 'Verification failed. Please try again.',
      };
    }
  }
}

export const enhancedAuthService = EnhancedAuthService.getInstance();
