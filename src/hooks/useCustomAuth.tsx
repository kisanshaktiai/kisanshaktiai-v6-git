
import React, { createContext, useContext, useState, useEffect } from 'react';
import { customAuthService } from '@/services/customAuthService';
import { secureStorage } from '@/services/storage/secureStorage';

interface Farmer {
  id: string;
  farmer_code: string;
  mobile_number: string;
  tenant_id: string;
}

interface Profile {
  id: string;
  mobile_number: string;
  full_name: string;
  is_profile_complete: boolean;
  tenant_id: string;
  [key: string]: any;
}

interface CustomAuthContextType {
  farmer: Farmer | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (mobileNumber: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (mobileNumber: string, pin: string, farmerData?: any) => Promise<{ success: boolean; error?: string }>;
  checkExistingUser: (mobileNumber: string) => Promise<{ exists: boolean; farmer?: any; profile?: any }>;
  updateProfile: (profileData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const CustomAuthContext = createContext<CustomAuthContextType | undefined>(undefined);

export const useCustomAuth = () => {
  const context = useContext(CustomAuthContext);
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within a CustomAuthProvider');
  }
  return context;
};

export const CustomAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      refreshSession();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Try to restore session
      const restored = await customAuthService.restoreSession();
      
      if (restored) {
        const currentFarmer = customAuthService.getCurrentFarmer();
        const currentProfile = customAuthService.getCurrentProfile();
        
        if (currentFarmer) {
          setFarmer(currentFarmer);
        }
        if (currentProfile) {
          setProfile(currentProfile);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const currentFarmer = customAuthService.getCurrentFarmer();
      const currentProfile = customAuthService.getCurrentProfile();
      const token = customAuthService.getCurrentToken();
      
      if (currentFarmer && token) {
        // If we have stored credentials but no current farmer state, restore it
        if (!farmer) {
          setFarmer(currentFarmer);
        }
        if (!profile && currentProfile) {
          setProfile(currentProfile);
        }
        
        // If online, try to refresh with server
        if (isOnline && !token.startsWith('offline_')) {
          await customAuthService.restoreSession();
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  const login = async (mobileNumber: string, pin: string) => {
    try {
      setLoading(true);
      const response = await customAuthService.login(mobileNumber, pin);
      
      if (response.success && response.farmer) {
        setFarmer(response.farmer);
        if (response.profile) {
          setProfile(response.profile);
        }
      }
      
      return { success: response.success, error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (mobileNumber: string, pin: string, farmerData?: any) => {
    try {
      setLoading(true);
      const response = await customAuthService.register(mobileNumber, pin, farmerData);
      
      if (response.success && response.farmer) {
        setFarmer(response.farmer);
        if (response.profile) {
          setProfile(response.profile);
        }
      }
      
      return { success: response.success, error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('Registration error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const checkExistingUser = async (mobileNumber: string) => {
    try {
      return await customAuthService.checkExistingUser(mobileNumber);
    } catch (error) {
      console.error('Check existing user error:', error);
      return { exists: false };
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      setLoading(true);
      const response = await customAuthService.updateProfile(profileData);
      
      if (response.success && response.profile) {
        setProfile(response.profile);
      }
      
      return { success: response.success, error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      console.error('Update profile error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await customAuthService.signOut();
      setFarmer(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue: CustomAuthContextType = {
    farmer,
    profile,
    loading,
    isAuthenticated: !!farmer,
    isOnline,
    login,
    register,
    checkExistingUser,
    updateProfile,
    signOut,
    refreshSession,
  };

  return (
    <CustomAuthContext.Provider value={contextValue}>
      {children}
    </CustomAuthContext.Provider>
  );
};
