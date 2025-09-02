
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType } from '@/types/auth';
import { useDispatch } from 'react-redux';
import { setAuthenticated, logout } from '@/store/slices/authSlice';
import { languageSyncService } from '@/services/LanguageSyncService';
import { 
  checkUserExists, 
  fetchProfile, 
  updateProfile as updateProfileService, 
  signOut as signOutService,
  signInWithPhone as signInWithPhoneService
} from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!session;

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          dispatch(setAuthenticated({ 
            userId: session.user.id,
            phoneNumber: session.user.phone || session.user.user_metadata?.mobile_number
          }));
          
          // Fetch and apply profile language (deferred to avoid blocking auth)
          setTimeout(async () => {
            try {
              const userProfile = await fetchProfile(session.user.id);
              setProfile(userProfile);
              
              // Apply profile language if available
              if (userProfile?.preferred_language) {
                await languageSyncService.applyProfileLanguage(
                  userProfile.preferred_language,
                  (updates) => updateProfileService(session.user.id, updates)
                );
              }
            } catch (error) {
              console.error('Failed to fetch profile:', error);
            }
          }, 0);
        } else {
          dispatch(logout());
          setProfile(null);
          languageSyncService.reset();
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  const signInWithPhone = async (phone: string) => {
    try {
      // Get language for registration from sync service
      const preferredLanguage = await languageSyncService.getLanguageForRegistration();
      
      const result = await signInWithPhoneService(phone);
      
      // Language will be applied through the auth state change listener
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutService();
      languageSyncService.reset();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<Profile> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const updatedProfile = await updateProfileService(user.id, updates);
      setProfile(updatedProfile);
      
      // If language preference was updated, sync it
      if (updates.preferred_language) {
        await languageSyncService.applyProfileLanguage(
          updates.preferred_language,
          (profileUpdates) => updateProfileService(user.id, profileUpdates)
        );
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated,
    signInWithPhone,
    signOut,
    updateProfile,
    checkUserExists,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
