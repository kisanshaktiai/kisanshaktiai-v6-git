
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType } from '@/types/auth';
import { AuthContext } from '@/contexts/AuthContext';
import { fetchProfile, checkUserExists, updateProfile as updateProfileService, signOut as signOutService, signInWithPhone as signInWithPhoneService } from '@/services/authService';

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleFetchProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching profile for user:', userId, 'retry count:', retryCount);
      const profileData = await fetchProfile(userId);
      if (profileData) {
        console.log('Profile fetched successfully:', profileData);
        setProfile(profileData);
        return profileData;
      } else {
        console.log('No profile found for user');
        
        // Retry up to 5 times with shorter delays for better UX
        if (retryCount < 5) {
          const delay = Math.min((retryCount + 1) * 1000, 5000); // Cap at 5 seconds
          console.log(`Retrying profile fetch in ${delay}ms...`);
          setTimeout(() => {
            handleFetchProfile(userId, retryCount + 1);
          }, delay);
        } else {
          console.log('Max retry attempts reached, profile may not exist yet');
        }
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      console.log('Starting sign in process for phone:', phone);
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
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    
    try {
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
          console.log('Auth state changed:', {
            event,
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id
          });
          
          // Update state immediately
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('User authenticated, fetching profile...');
            // Fetch profile immediately when user is authenticated
            setTimeout(() => {
              handleFetchProfile(session.user.id);
            }, 100); // Small delay to ensure session is fully established
          } else {
            console.log('No user session, clearing profile');
            setProfile(null);
          }
          
          // Set loading to false when we have a definitive auth state
          setLoading(false);
        });

        // THEN check for existing session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        console.log('Initial session check:', {
          hasSession: !!initialSession,
          hasUser: !!initialSession?.user,
          userId: initialSession?.user?.id
        });
        
        if (initialSession?.user) {
          console.log('Found existing session');
          setSession(initialSession);
          setUser(initialSession.user);
          await handleFetchProfile(initialSession.user.id);
        } else {
          console.log('No existing session found');
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
