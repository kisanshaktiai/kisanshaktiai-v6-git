
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { Database } from '@/integrations/supabase/types';
import { sessionService } from './sessionService';
import { authHealthService } from './authHealthService';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

// Helper function to safely parse JSON
const safeJsonParse = (value: any, fallback: any = null) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

// Helper function to convert database row to Profile type
const convertToProfile = (data: UserProfileRow): Profile => {
  return {
    ...data,
    notification_preferences: safeJsonParse(data.notification_preferences, {
      sms: true,
      push: true,
      email: false,
      whatsapp: true,
      calls: false
    }),
    device_tokens: safeJsonParse(data.device_tokens, []),
    expertise_areas: Array.isArray(data.expertise_areas) ? data.expertise_areas : [],
    metadata: safeJsonParse(data.metadata, {})
  };
};

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log('Fetching user profile for:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return convertToProfile(data);
  } catch (error) {
    console.error('Error in fetchProfile:', error);
    return null;
  }
};

export const checkUserExists = async (phone: string): Promise<boolean> => {
  try {
    console.log('=== CLIENT-SIDE USER EXISTENCE CHECK ===');
    console.log('Input phone number:', phone);
    
    // Clean phone number - ensure it's a 10-digit string
    const cleanPhone = phone.replace(/\D/g, '');
    console.log('Cleaned phone number:', cleanPhone);
    
    if (cleanPhone.length !== 10) {
      console.log('Invalid phone number length:', cleanPhone.length);
      return false;
    }
    
    // Call the mobile-auth-check edge function
    const { data, error } = await supabase.functions.invoke('mobile-auth-check', {
      body: { phone: cleanPhone, checkOnly: true }
    });

    if (error) {
      console.error('Error checking user existence via edge function:', error);
      return await checkUserExistsDirect(cleanPhone);
    }

    console.log('Edge function user check result:', data);
    return data?.userExists || false;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    return await checkUserExistsDirect(phone.replace(/\D/g, ''));
  }
};

// Fallback direct database check
const checkUserExistsDirect = async (cleanPhone: string): Promise<boolean> => {
  try {
    console.log('=== FALLBACK DIRECT DATABASE CHECK ===');
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, phone, full_name')
      .eq('phone', cleanPhone);
    
    if (error) {
      console.error('Error in direct database check:', error);
      return false;
    }
    
    console.log('Direct database query results:', profiles);
    const userExists = profiles && profiles.length > 0;
    console.log('Direct database check result:', { exists: userExists });
    
    return userExists;
  } catch (error) {
    console.error('Error in checkUserExistsDirect:', error);
    return false;
  }
};

export const signInWithPhone = async (phone: string): Promise<void> => {
  try {
    console.log('Starting mobile authentication for phone:', phone);
    
    // Log authentication event
    await authHealthService.logAuthEvent('sign_in_started', { phone: phone.replace(/\d/g, '*') });
    
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      throw new Error('Invalid phone number. Please enter a valid 10-digit mobile number.');
    }
    
    // Get current selected language to save in profile
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'hi';
    
    // Detect current tenant before authentication
    const tenantService = TenantDetectionService.getInstance();
    const currentTenant = await tenantService.detectTenant();
    
    console.log('Current tenant for auth:', currentTenant);
    
    // Call our mobile auth edge function with tenant context and language preference
    const { data, error } = await supabase.functions.invoke('mobile-auth', {
      body: { 
        phone: cleanPhone,
        tenantId: currentTenant?.id || 'default',
        preferredLanguage: selectedLanguage
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      await authHealthService.logAuthEvent('edge_function_error', { error: error.message });
      throw new Error(error.message || 'Authentication service error. Please try again.');
    }

    console.log('Edge function response:', data);
    await authHealthService.logAuthEvent('edge_function_success', { 
      hasSession: !!data?.session,
      isNewUser: data?.isNewUser 
    });

    if (!data?.success) {
      await authHealthService.logAuthEvent('auth_response_error', { error: data?.error });
      throw new Error(data?.error || 'Authentication failed. Please try again.');
    }

    // Enhanced session validation using SessionService
    const validation = sessionService.validateSessionData(data.session);
    if (!validation.isValid || !validation.session) {
      console.error('Invalid session data received:', data);
      await authHealthService.logAuthEvent('session_validation_failed', { 
        error: validation.error,
        sessionData: {
          hasAccessToken: !!data.session?.access_token,
          hasRefreshToken: !!data.session?.refresh_token,
          hasUser: !!data.session?.user
        }
      });
      throw new Error(`Invalid authentication response: ${validation.error}`);
    }

    console.log('Setting session with validated tokens...');
    await authHealthService.logAuthEvent('session_setting_started', {
      userId: data.user?.id,
      isNewUser: data.isNewUser
    });
    
    // Use enhanced session service to set session with retry mechanism
    const session = await sessionService.setSession(data.session);

    console.log('Session set successfully:', {
      hasUser: !!session.user,
      userId: session.user?.id
    });
    
    await authHealthService.logAuthEvent('session_set_success', {
      userId: session.user?.id,
      isNewUser: data.isNewUser
    });

    console.log('Mobile authentication completed successfully');
    await authHealthService.logAuthEvent('sign_in_completed', {
      userId: session.user?.id,
      isNewUser: data.isNewUser
    });
    
  } catch (error) {
    console.error('Mobile authentication failed:', error);
    
    await authHealthService.logAuthEvent('sign_in_failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error.message.includes('Invalid phone')) {
        throw error; // Already user-friendly
      } else if (error.message.includes('Invalid access token format') || 
                 error.message.includes('Invalid refresh token format') ||
                 error.message.includes('Invalid JWT structure')) {
        throw new Error('Authentication service error. Please try again or contact support.');
      } else {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
    } else {
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await authHealthService.logAuthEvent('sign_out_started', {});
    
    // Clear stored session first
    await sessionService.clearSession();
    
    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      await authHealthService.logAuthEvent('sign_out_error', { error: error.message });
      throw error;
    }
    
    console.log('Sign out successful');
    await authHealthService.logAuthEvent('sign_out_completed', {});
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<void> => {
  try {
    // Convert Profile updates to database format, handling type conversions
    const dbUpdates: Partial<UserProfileRow> = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that exist in both types and handle special cases
    const allowedFields: (keyof UserProfileRow)[] = [
      'phone', 'phone_verified', 'full_name', 'display_name', 'date_of_birth',
      'gender', 'address_line1', 'address_line2', 'village', 'taluka', 'district',
      'state', 'pincode', 'country', 'avatar_url', 'bio', 'aadhaar_number',
      'farmer_id', 'shc_id', 'coordinates', 'last_active_at', 'device_tokens',
      'notification_preferences', 'metadata', 'expertise_areas'
    ];

    // Copy allowed fields
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (dbUpdates as any)[field] = updates[field];
      }
    });

    // Handle preferred_language separately with validation
    if (updates.preferred_language) {
      const validLanguages = ['en', 'hi', 'mr', 'pa', 'gu', 'te', 'ta', 'kn', 'ml', 'or', 'bn'] as const;
      if (validLanguages.includes(updates.preferred_language as any)) {
        dbUpdates.preferred_language = updates.preferred_language as any;
      }
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
};
