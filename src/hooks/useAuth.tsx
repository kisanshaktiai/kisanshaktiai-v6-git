
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType } from '@/types/auth';
import { fetchProfile, updateProfile as updateUserProfile, signOut as authSignOut, checkUserExists, signInWithPhone } from '@/services/authService';
import { LanguageService } from '@/services/LanguageService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to safely parse JSON and ensure proper typing
const parseProfileData = (rawProfile: any): Profile => {
  // Helper to safely parse JSON values
  const safeJsonParse = (value: any, fallback: any) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    if (typeof value === 'object') return value;
    return fallback;
  };

  return {
    ...rawProfile,
    notification_preferences: safeJsonParse(rawProfile.notification_preferences, {
      sms: true,
      push: true,
      email: false,
      whatsapp: true,
      calls: false
    }),
    device_tokens: safeJsonParse(rawProfile.device_tokens, []),
    coordinates: rawProfile.coordinates,
    metadata: safeJsonParse(rawProfile.metadata, {}),
    expertise_areas: Array.isArray(rawProfile.expertise_areas) ? rawProfile.expertise_areas : []
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleFetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching profile for user:', userId);
      const rawProfile = await fetchProfile(userId);
      
      if (rawProfile) {
        console.log('Profile fetched successfully');
        const parsedProfile = parseProfileData(rawProfile);
        setProfile(parsedProfile);
        
        // Apply user's saved language preference
        if (parsedProfile.preferred_language) {
          try {
            await LanguageService.getInstance().changeLanguage(parsedProfile.preferred_language);
            console.log('Applied user language preference:', parsedProfile.preferred_language);
          } catch (error) {
            console.error('Error applying user language preference:', error);
          }
        }
        
        return parsedProfile;
      } else if (retryCount < 3) {
        // Retry with exponential backoff for new users (profile might be created by trigger)
        const delay = Math.min((retryCount + 1) * 1000, 3000);
        console.log(`Profile not found, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return handleFetchProfile(userId, retryCount + 1);
      } else {
        console.log('Profile not found after retries, user might be new');
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (retryCount < 2) {
        const delay = Math.min((retryCount + 1) * 1000, 2000);
        console.log(`Retrying profile fetch in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return handleFetchProfile(userId, retryCount + 1);
      }
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    console.log('Setting up auth state listener...');

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Fetch profile after a brief delay to allow trigger to execute
          setTimeout(() => {
            if (mounted) {
              handleFetchProfile(session.user.id);
            }
          }, 500);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        handleFetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error('Error getting initial session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleFetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedProfile = await updateUserProfile(user.id, updates);
      if (updatedProfile) {
        const parsedProfile = parseProfileData(updatedProfile);
        setProfile(parsedProfile);
        return parsedProfile;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [user]);

  const signOut = useCallback(async () => {
    try {
      await authSignOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    signInWithPhone,
    signOut,
    updateProfile,
    checkUserExists
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
