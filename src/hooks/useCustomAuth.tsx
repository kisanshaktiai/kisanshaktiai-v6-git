
import React, { createContext, useContext, useState, useEffect } from 'react';
import { customAuthService } from '@/services/customAuthService';

interface Farmer {
  id: string;
  farmer_code: string;
  mobile_number: string;
  tenant_id: string;
}

interface CustomAuthContextType {
  farmer: Farmer | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (mobileNumber: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (mobileNumber: string, pin: string, farmerData?: any) => Promise<{ success: boolean; error?: string }>;
  checkExistingFarmer: (mobileNumber: string) => Promise<boolean>;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Try to restore session from localStorage
      const restored = await customAuthService.restoreSession();
      
      if (restored) {
        const currentFarmer = customAuthService.getCurrentFarmer();
        setFarmer(currentFarmer);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (mobileNumber: string, pin: string) => {
    try {
      setLoading(true);
      const response = await customAuthService.login(mobileNumber, pin);
      
      if (response.success && response.farmer) {
        setFarmer(response.farmer);
      }
      
      return { success: response.success, error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
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
      }
      
      return { success: response.success, error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const checkExistingFarmer = async (mobileNumber: string) => {
    return await customAuthService.checkExistingFarmer(mobileNumber);
  };

  const signOut = async () => {
    try {
      await customAuthService.signOut();
      setFarmer(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const contextValue: CustomAuthContextType = {
    farmer,
    loading,
    isAuthenticated: !!farmer,
    login,
    register,
    checkExistingFarmer,
    signOut,
  };

  return (
    <CustomAuthContext.Provider value={contextValue}>
      {children}
    </CustomAuthContext.Provider>
  );
};
