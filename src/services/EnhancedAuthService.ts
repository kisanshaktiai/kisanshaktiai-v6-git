
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
      console.log('Starting enhanced mobile authentication for:', phone.replace(/\d/g, '*'));

      // First test the connection with enhanced error messages
      const connectionTest = await connectionService.testConnection();
      if (!connectionTest.isConnected) {
        return {
          success: false,
          error: connectionTest.error || 'Cannot connect to servers. Please check your internet connection.',
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

      // Clean and validate phone number
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit Indian mobile number.',
        };
      }

      // Get current selected language
      const selectedLanguage = localStorage.getItem('selectedLanguage') || 'hi';

      // Log authentication attempt
      await authHealthService.logAuthEvent('mobile_auth_attempt', {
        phone: cleanPhone.replace(/\d/g, '*'),
        tenantId,
        timestamp: new Date().toISOString()
      });

      // Call the mobile auth edge function with correct field names
      const { data, error } = await connectionService.callEdgeFunction(
        'mobile-auth',
        {
          mobile_number: cleanPhone,
          tenantId: tenantId,
          preferredLanguage: selectedLanguage
        },
        {
          retries: 2,
          timeout: 15000
        }
      );

      if (error) {
        console.error('Mobile auth edge function error:', error);
        
        await authHealthService.logAuthEvent('mobile_auth_error', {
          phone: cleanPhone.replace(/\d/g, '*'),
          error,
          tenantId
        });

        return {
          success: false,
          error: typeof error === 'string' ? error : 'Unable to connect to KisanShakti AI servers. Please check your internet connection and try again.',
        };
      }

      if (data?.success) {
        await authHealthService.logAuthEvent('mobile_auth_success', {
          phone: cleanPhone.replace(/\d/g, '*'),
          tenantId,
          isNewUser: data.isNewUser
        });

        return {
          success: true,
          data: data,
          requiresVerification: false
        };
      }

      return {
        success: false,
        error: data?.error || 'Authentication failed. Please try again.',
      };

    } catch (error) {
      console.error('Enhanced mobile auth error:', error);
      
      await authHealthService.logAuthEvent('mobile_auth_exception', {
        phone: phone.replace(/\d/g, '*'),
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });

      return {
        success: false,
        error: 'Unable to access KisanShakti AI. Please try again.',
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
          error: connectionTest.error || 'Cannot connect to servers. Please check your internet connection.',
        };
      }

      const { data, error } = await connectionService.callEdgeFunction(
        'mobile-auth',
        {
          mobile_number: cleanPhone,
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
          phone: cleanPhone.replace(/\d/g, '*')
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
