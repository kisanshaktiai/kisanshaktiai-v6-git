import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { Database } from '@/integrations/supabase/types';

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
    
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      throw new Error('Invalid phone number. Please enter a valid 10-digit mobile number.');
    }
    
    // Detect current tenant before authentication
    const tenantService = TenantDetectionService.getInstance();
    const currentTenant = await tenantService.detectTenant();
    
    console.log('Current tenant for auth:', currentTenant);
    
    // Call our mobile auth edge function with tenant context
    const { data, error } = await supabase.functions.invoke('mobile-auth', {
      body: { 
        phone: cleanPhone,
        tenantId: currentTenant?.id || 'default'
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Authentication service error. Please try again.');
    }

    console.log('Edge function response:', data);

    if (!data?.success) {
      throw new Error(data?.error || 'Authentication failed. Please try again.');
    }

    // Validate session data structure
    if (!data.session || !data.session.access_token || !data.session.refresh_token) {
      console.error('Invalid session data received:', data);
      throw new Error('Invalid authentication response. Please try again.');
    }

    console.log('Setting session with tokens:', {
      hasAccessToken: !!data.session.access_token,
      hasRefreshToken: !!data.session.refresh_token,
      userId: data.user?.id,
      expiresAt: data.session.expires_at,
      isNewUser: data.isNewUser
    });
    
    // Set the session using Supabase client
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

    if (sessionError) {
      console.error('Session setting error:', sessionError);
      throw new Error('Failed to establish session. Please try again.');
    }

    console.log('Session set successfully:', {
      hasUser: !!sessionData.user,
      hasSession: !!sessionData.session,
      userId: sessionData.user?.id
    });
    
    // Verify the session was actually set
    const { data: { session: verifySession } } = await supabase.auth.getSession();
    
    if (!verifySession) {
      console.error('Session verification failed - session not found after setting');
      throw new Error('Failed to establish authenticated session. Please try again.');
    }

    console.log('Session verification successful:', {
      userId: verifySession.user?.id,
      isNewUser: data.isNewUser
    });

    console.log('Mobile authentication completed successfully');
  } catch (error) {
    console.error('Mobile authentication failed:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error.message.includes('Invalid phone')) {
        throw error; // Already user-friendly
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    console.log('Sign out successful');
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
