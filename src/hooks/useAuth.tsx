
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType } from '@/types/auth';
import { AuthContext } from '@/contexts/AuthContext';
import { fetchProfile, checkUserExists, updateProfile as updateProfileService, signOut as signOutService, signInWithPhone as signInWithPhoneService } from '@/services/authService';
import { LanguageService } from '@/services/LanguageService';
import { sessionService } from '@/services/sessionService';

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
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

  const handleFetchProfile = async (userId: string, retryCount = 0) => {
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
        // Retry with exponential backoff
        const delay = Math.min((retryCount + 1) * 1000, 3000);
        console.log(`Retrying profile fetch in ${delay}ms...`);
        setTimeout(() => {
          handleFetchProfile(userId, retryCount + 1);
        }, delay);
      } else {
        console.log('Profile not found after retries');
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      console.log('Starting sign in process...');
      setLoading(true);
      
      await signInWithPhoneService(phone);
      console.log('Sign in process completed successfully');
    } catch (error) {
      console.error('Sign in process failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await signOutService();
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear language preference
      localStorage.removeItem('languageSelectedAt');
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    
    try {
      // Apply language preference immediately if being updated
      if (updates.preferred_language) {
        await LanguageService.getInstance().changeLanguage(updates.preferred_language);
        localStorage.setItem('selectedLanguage', updates.preferred_language);
        localStorage.setItem('languageSelectedAt', new Date().toISOString());
      }
      
      await updateProfileService(user.id, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, !!session);
          
          // Update state immediately
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('User authenticated, fetching profile...');
            // Use setTimeout to prevent auth callback deadlock
            setTimeout(() => {
              handleFetchProfile(session.user.id);
            }, 100);
          } else {
            console.log('No user session, clearing profile');
            setProfile(null);
          }
          
          setLoading(false);
        });

        // Try to restore session from storage
        console.log('Attempting to restore session...');
        const restoredSession = await sessionService.restoreSession();
        
        if (restoredSession) {
          console.log('Session restored from storage');
          // Auth state change will be triggered automatically
        } else {
          // Check for existing session in Supabase
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          
          if (initialSession?.user) {
            console.log('Found existing session');
            setSession(initialSession);
            setUser(initialSession.user);
            await handleFetchProfile(initialSession.user.id);
            
            // Store the session for future restoration
            await sessionService.storeSession(initialSession);
          } else {
            console.log('No existing session found');
          }
        }
        
        setLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error during auth initialization:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!session?.user,
    signInWithPhone,
    signOut,
    updateProfile,
    checkUserExists,
    farmer: null,
    currentAssociation: null
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
