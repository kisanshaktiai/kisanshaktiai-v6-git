
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
      console.log('CustomAuthProvider: Coming back online');
      setIsOnline(true);
      refreshSession(); // Refresh session when coming back online
    };
    
    const handleOffline = () => {
      console.log('CustomAuthProvider: Going offline');
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
      console.log('CustomAuthProvider: Initializing authentication');
      setLoading(true);
      
      // Try to restore session
      const restored = await customAuthService.restoreSession();
      
      if (restored) {
        const currentFarmer = customAuthService.getCurrentFarmer();
        const currentUserProfile = customAuthService.getCurrentUserProfile();
        
        console.log('CustomAuthProvider: Session restored:', {
          farmer: currentFarmer,
          profile: currentUserProfile
        });
        
        if (currentFarmer && currentFarmer.id) {
          setFarmer(currentFarmer);
        }
        if (currentUserProfile && currentUserProfile.id) {
          setUserProfile(currentUserProfile);
        }
        
        console.log('CustomAuthProvider: Session restored successfully');
      } else {
        console.log('CustomAuthProvider: No session to restore');
      }
    } catch (error) {
      console.error('CustomAuthProvider: Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('CustomAuthProvider: Refreshing session');
      const currentFarmer = customAuthService.getCurrentFarmer();
      const currentUserProfile = customAuthService.getCurrentUserProfile();
      const token = customAuthService.getCurrentToken();
      
      if (currentFarmer && token) {
        console.log('CustomAuthProvider: Refreshing session with stored data');
        // If we have stored credentials but no current farmer state, restore it
        if (!farmer && currentFarmer.id) {
          setFarmer(currentFarmer);
        }
        if (!userProfile && currentUserProfile && currentUserProfile.id) {
          setUserProfile(currentUserProfile);
        }
        
        // Refresh user profile data if online
        if (isOnline) {
          await refreshUserProfile();
        }
      }
    } catch (error) {
      console.error('CustomAuthProvider: Session refresh error:', error);
    }
  };

  const refreshUserProfile = async () => {
    try {
      console.log('CustomAuthProvider: Refreshing user profile');
      await customAuthService.refreshUserProfile();
      const updatedProfile = customAuthService.getCurrentUserProfile();
      if (updatedProfile && updatedProfile.id) {
        setUserProfile(updatedProfile);
        console.log('CustomAuthProvider: User profile refreshed');
      }
    } catch (error) {
      console.error('CustomAuthProvider: User profile refresh error:', error);
    }
  };

  const login = async (mobileNumber: string, pin: string) => {
    try {
      console.log('CustomAuthProvider: Attempting login');
      setLoading(true);
      const response = await customAuthService.login(mobileNumber, pin);
      
      if (response.success && response.farmer) {
        console.log('CustomAuthProvider: Login successful', response);
        setFarmer(response.farmer);
        if (response.user_profile) {
          setUserProfile(response.user_profile);
        }
        console.log('CustomAuthProvider: Login successful, farmer and profile set');
      } else {
        console.error('CustomAuthProvider: Login failed:', response.error);
      }
      
      return { success: response.success, error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('CustomAuthProvider: Login error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (mobileNumber: string, pin: string, farmerData?: any) => {
    try {
      console.log('CustomAuthProvider: Attempting registration');
      setLoading(true);
      const response = await customAuthService.register(mobileNumber, pin, farmerData);
      
      if (response.success && response.farmer) {
        console.log('CustomAuthProvider: Registration successful', response);
        setFarmer(response.farmer);
        if (response.user_profile) {
          setUserProfile(response.user_profile);
        }
        console.log('CustomAuthProvider: Registration successful, farmer and profile set');
      } else {
        console.error('CustomAuthProvider: Registration failed:', response.error);
      }
      
      return { success: response.success, error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('CustomAuthProvider: Registration error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const checkExistingFarmer = async (mobileNumber: string) => {
    try {
      console.log('CustomAuthProvider: Checking existing farmer');
      return await customAuthService.checkExistingFarmer(mobileNumber);
    } catch (error) {
      console.error('CustomAuthProvider: Check existing farmer error:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      console.log('CustomAuthProvider: Signing out');
      setLoading(true);
      await customAuthService.signOut();
      setFarmer(null);
      setUserProfile(null);
      console.log('CustomAuthProvider: Sign out successful');
    } catch (error) {
      console.error('CustomAuthProvider: Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!farmer && !!farmer.id;
  
  console.log('CustomAuthProvider: Current state:', {
    farmer: farmer?.id,
    userProfile: userProfile?.id,
    loading,
    isAuthenticated,
    isOnline
  });

  const contextValue: CustomAuthContextType = {
    farmer,
    userProfile,
    loading,
    isAuthenticated,
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
