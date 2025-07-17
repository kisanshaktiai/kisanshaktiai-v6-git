
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { Database } from '@/integrations/supabase/types';
import { sessionService } from './sessionService';

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
    console.log('Checking if user exists for phone:', phone.replace(/\d/g, '*'));
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return false;
    }
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .limit(1);
    
    if (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
    
    return profiles && profiles.length > 0;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    return false;
  }
};

export const signInWithPhone = async (phone: string): Promise<void> => {
  try {
    console.log('Starting mobile authentication...');
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }
    
    // Get current selected language
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'hi';
    
    // Detect current tenant
    const tenantService = TenantDetectionService.getInstance();
    await tenantService.clearCache();
    const currentTenant = await tenantService.detectTenant();
    
    console.log('Calling mobile auth edge function...');
    
    // Call simplified mobile auth edge function
    const { data, error } = await supabase.functions.invoke('mobile-auth', {
      body: { 
        phone: cleanPhone,
        tenantId: currentTenant?.id || 'default',
        preferredLanguage: selectedLanguage
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Authentication failed. Please try again.');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Authentication failed. Please try again.');
    }

    console.log('Edge function completed successfully:', data);

    // Handle authentication flow - both new and existing users get credentials
    if (data.credentials) {
      console.log('Signing in user with credentials...');
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.credentials.email,
        password: data.credentials.password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error('Failed to complete authentication. Please try again.');
      }

      if (!authData.session) {
        throw new Error('Authentication failed. Please try again.');
      }

      // Use session service to track the session
      await sessionService.setSession(authData.session);
      console.log('User authentication completed successfully');
    } else {
      throw new Error('Authentication failed - no credentials provided by server.');
    }
    
  } catch (error) {
    console.error('Mobile authentication failed:', error);
    
    // Enhanced error handling with more specific messages
    if (error instanceof Error) {
      if (error.message.includes('valid 10-digit')) {
        throw error; // Already user-friendly
      } else if (error.message.includes('Edge Function returned a non-2xx status code')) {
        throw new Error('Unable to connect to KisanShakti AI servers. Please check your internet connection and try again.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error.message.includes('service temporarily unavailable')) {
        throw new Error('KisanShakti AI is currently under maintenance. Please try again in a few minutes.');
      } else {
        throw new Error(error.message || 'Unable to access KisanShakti AI. Please try again.');
      }
    } else {
      throw new Error('An unexpected error occurred. Please restart the app and try again.');
    }
  }
};

export const signOut = async (): Promise<void> => {
  try {
    console.log('Starting sign out...');
    
    // Clear stored session first
    await sessionService.clearSession();
    
    // Then sign out from Supabase
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
    // Convert Profile updates to database format
    const dbUpdates: Partial<UserProfileRow> = {
      updated_at: new Date().toISOString()
    };

    // Copy allowed fields
    const allowedFields: (keyof UserProfileRow)[] = [
      'phone', 'phone_verified', 'full_name', 'display_name', 'date_of_birth',
      'gender', 'address_line1', 'address_line2', 'village', 'taluka', 'district',
      'state', 'pincode', 'country', 'avatar_url', 'bio', 'aadhaar_number',
      'farmer_id', 'shc_id', 'coordinates', 'last_active_at', 'device_tokens',
      'notification_preferences', 'metadata', 'expertise_areas'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (dbUpdates as any)[field] = updates[field];
      }
    });

    // Handle preferred_language separately
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
