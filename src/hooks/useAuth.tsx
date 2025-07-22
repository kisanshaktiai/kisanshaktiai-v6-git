
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType } from '@/types/auth';
import { AuthContext } from '@/contexts/AuthContext';
import { LanguageService } from '@/services/LanguageService';
import { sessionService } from '@/services/sessionService';
import { useCustomAuth } from '@/hooks/useCustomAuth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { farmer, isAuthenticated: customAuthAuthenticated, checkExistingFarmer } = useCustomAuth();

  // Convert farmer to profile format when available
  useEffect(() => {
    if (farmer && customAuthAuthenticated) {
      const farmerProfile: Profile = {
        id: farmer.id,
        phone: farmer.mobile_number,
        phone_verified: true,
        full_name: farmer.farmer_code,
        display_name: farmer.farmer_code,
        farmer_id: farmer.id,
        preferred_language: 'hi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(farmerProfile);
    } else {
      setProfile(null);
    }
  }, [farmer, customAuthAuthenticated]);

  const signInWithPhone = async (phone: string) => {
    try {
      console.log('Starting sign in process for phone:', phone);
      setLoading(true);
      
      // Check if user exists first
      const userExists = await checkExistingFarmer(phone);
      
      if (!userExists) {
        // This is handled by the UI flow now
        throw new Error('User not found. Please create an account first.');
      }
      
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
      // Clear custom auth state
      await supabase.auth.signOut();
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
    if (!farmer) return;
    
    try {
      // Apply language preference immediately if being updated
      if (updates.preferred_language) {
        await LanguageService.getInstance().changeLanguage(updates.preferred_language);
        localStorage.setItem('selectedLanguage', updates.preferred_language);
        localStorage.setItem('languageSelectedAt', new Date().toISOString());
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const checkUserExists = async (phone: string) => {
    try {
      return await checkExistingFarmer(phone);
    } catch (error) {
      console.error('Error checking user exists:', error);
      return false;
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: customAuthAuthenticated,
    signInWithPhone,
    signOut,
    updateProfile,
    checkUserExists,
    farmer,
    currentAssociation: null
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
