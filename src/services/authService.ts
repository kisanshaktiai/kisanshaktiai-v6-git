
import { supabase } from '@/integrations/supabase/client';
import { languageSyncService } from './LanguageSyncService';

// Simple client-side cache for user existence checks
const userExistenceCache = new Map<string, { exists: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const checkUserExists = async (phone: string): Promise<boolean> => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check cache first
    const cacheKey = cleanPhone;
    const cachedResult = userExistenceCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      console.log('Using cached user existence result for:', cleanPhone.replace(/\d/g, '*'));
      return cachedResult.exists;
    }

    console.log('Calling mobile-auth-check edge function for phone:', cleanPhone.replace(/\d/g, '*'));
    
    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('mobile-auth-check', {
      body: { phone: cleanPhone, checkOnly: true }
    });

    const queryTime = Date.now() - startTime;
    console.log(`User existence check completed in ${queryTime}ms`);

    if (error) {
      console.error('Error checking user existence:', error);
      throw new Error(`Failed to check user existence: ${error.message}`);
    }

    const userExists = data?.userExists || false;
    
    // Cache the result
    userExistenceCache.set(cacheKey, {
      exists: userExists,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (userExistenceCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of userExistenceCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          userExistenceCache.delete(key);
        }
      }
    }

    console.log('User existence check result:', {
      phone: cleanPhone.replace(/\d/g, '*'),
      exists: userExists,
      queryTime: `${queryTime}ms`,
      cached: false
    });

    return userExists;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    throw error;
  }
};

export const fetchProfile = async (userId: string) => {
  try {
    console.log('Fetching user profile from database for user:', userId);
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('User profile not found, will be created by trigger');
        return null;
      }
      console.error('Error fetching profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    console.log('User profile fetched successfully:', profile);
    return profile;
  } catch (error) {
    console.error('Error in fetchProfile:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<any>) => {
  try {
    console.log('Updating user profile for user:', userId, 'with updates:', updates);
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    console.log('User profile updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('Signing out user...');
    
    // Clear cache
    userExistenceCache.clear();
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw new Error(`Sign out failed: ${error.message}`);
    }

    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
};

export const signInWithPhone = async (phone: string, tenantId?: string) => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    console.log('Starting authentication process for:', cleanPhone.replace(/\d/g, '*'));

    // Get preferred language from sync service
    const preferredLanguage = await languageSyncService.getLanguageForRegistration();

    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('mobile-auth', {
      body: {
        mobile_number: cleanPhone,
        tenantId: tenantId || null,
        preferredLanguage: preferredLanguage
      }
    });

    const authTime = Date.now() - startTime;
    console.log(`Mobile auth edge function completed in ${authTime}ms`);

    if (error) {
      console.error('Error from mobile-auth function:', error);
      throw new Error(error.message || 'Authentication failed');
    }

    if (!data?.success) {
      console.error('Authentication failed:', data?.error);
      throw new Error(data?.error || 'Authentication failed');
    }

    // Clear cache since user status might have changed
    userExistenceCache.clear();

    // Sign in with the temporary credentials
    const signInStartTime = Date.now();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.credentials.email,
      password: data.credentials.password,
    });

    const signInTime = Date.now() - signInStartTime;
    console.log(`Supabase sign in completed in ${signInTime}ms`);

    if (signInError) {
      console.error('Error signing in with credentials:', signInError);
      throw new Error('Failed to sign in: ' + signInError.message);
    }

    console.log('Authentication successful for user:', data.userId);
    
    return {
      ...data,
      session: authData.session,
      user: authData.user
    };
  } catch (error) {
    console.error('Error in signInWithPhone:', error);
    throw error;
  }
};
