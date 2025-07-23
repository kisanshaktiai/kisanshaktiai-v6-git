
import React, { createContext, useContext, useState, useEffect } from 'react';
import { customAuthService } from '@/services/customAuthService';
import { secureStorage } from '@/services/storage/secureStorage';

interface Farmer {
  id: string;
  farmer_code: string;
  mobile_number: string;
  tenant_id: string;
}

interface UserProfile {
  id: string;
  mobile_number: string;
  preferred_language: string;
  full_name?: string;
  farmer_id: string;
}

interface CustomAuthContextType {
  farmer: Farmer | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (mobileNumber: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (mobileNumber: string, pin: string, farmerData?: any) => Promise<{ success: boolean; error?: string }>;
  checkExistingFarmer: (mobileNumber: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      refreshSession(); // Refresh session when coming back online
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
        const currentUserProfile = customAuthService.getCurrentUserProfile();
        
        if (currentFarmer) {
          setFarmer(currentFarmer);
        }
        if (currentUserProfile) {
          setUserProfile(currentUserProfile);
        }
        
        console.log('Session restored successfully');
      } else {
        console.log('No session to restore');
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
      const currentUserProfile = customAuthService.getCurrentUserProfile();
      const token = customAuthService.getCurrentToken();
      
      if (currentFarmer && token) {
        // If we have stored credentials but no current farmer state, restore it
        if (!farmer) {
          setFarmer(currentFarmer);
        }
        if (!userProfile && currentUserProfile) {
          setUserProfile(currentUserProfile);
        }
        
        // Refresh user profile data if online
        if (isOnline) {
          await refreshUserProfile();
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  const refreshUserProfile = async () => {
    try {
      await customAuthService.refreshUserProfile();
      const updatedProfile = customAuthService.getCurrentUserProfile();
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('User profile refresh error:', error);
    }
  };

  const login = async (mobileNumber: string, pin: string) => {
    try {
      setLoading(true);
      const response = await customAuthService.login(mobileNumber, pin);
      
      if (response.success && response.farmer) {
        setFarmer(response.farmer);
        if (response.user_profile) {
          setUserProfile(response.user_profile);
        }
        console.log('Login successful, farmer and profile set');
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
        if (response.user_profile) {
          setUserProfile(response.user_profile);
        }
        console.log('Registration successful, farmer and profile set');
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

  const checkExistingFarmer = async (mobileNumber: string) => {
    try {
      return await customAuthService.checkExistingFarmer(mobileNumber);
    } catch (error) {
      console.error('Check existing farmer error:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await customAuthService.signOut();
      setFarmer(null);
      setUserProfile(null);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue: CustomAuthContextType = {
    farmer,
    userProfile,
    loading,
    isAuthenticated: !!farmer,
    isOnline,
    login,
    register,
    checkExistingFarmer,
    signOut,
    refreshSession,
    refreshUserProfile,
  };

  return (
    <CustomAuthContext.Provider value={contextValue}>
      {children}
    </CustomAuthContext.Provider>
  );
};
