
import React, { useState, useEffect, createContext, useContext } from 'react';
import { secureApiGateway, type AuthState } from '@/services/SecureApiGateway';
import { tenantApiService } from '@/services/api/TenantApiService';
import type { LoginRequest, RegisterRequest } from '@/services/api/AuthApiService';
import type { FarmerProfile } from '@/services/api/FarmerApiService';
import type { TenantInfo } from '@/services/api/TenantApiService';

interface SecureAuthContextType extends AuthState {
  login: (request: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (request: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkFarmerExists: (mobileNumber: string) => Promise<boolean>;
  updateProfile: (updates: Partial<FarmerProfile>) => Promise<{ success: boolean; error?: string }>;
  getDefaultTenant: () => Promise<TenantInfo | null>;
  loading: boolean;
  isOnline: boolean;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export const useSecureAuth = () => {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
};

export const SecureAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    farmer: null,
    tenant: null,
    token: null
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize secure API gateway
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        await secureApiGateway.initialize();
        
        // Update auth state from gateway
        const currentAuthState = secureApiGateway.getAuthState();
        setAuthState(currentAuthState);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (request: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const result = await secureApiGateway.login(request);
      
      if (result.success) {
        const newAuthState = secureApiGateway.getAuthState();
        setAuthState(newAuthState);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (request: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const result = await secureApiGateway.register(request);
      
      if (result.success) {
        const newAuthState = secureApiGateway.getAuthState();
        setAuthState(newAuthState);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('Registration error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await secureApiGateway.logout();
      
      setAuthState({
        isAuthenticated: false,
        farmer: null,
        tenant: null,
        token: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFarmerExists = async (mobileNumber: string): Promise<boolean> => {
    try {
      return await secureApiGateway.checkFarmerExists(mobileNumber);
    } catch (error) {
      console.error('Check farmer exists error:', error);
      return false;
    }
  };

  const getDefaultTenant = async (): Promise<TenantInfo | null> => {
    try {
      return await secureApiGateway.getDefaultTenant();
    } catch (error) {
      console.error('Get default tenant error:', error);
      return null;
    }
  };

  const updateProfile = async (updates: Partial<FarmerProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const farmerApi = secureApiGateway.getFarmerApi();
      const response = await farmerApi.updateProfile(updates);
      
      if (response.success && response.data) {
        // Update local auth state
        setAuthState(prev => ({
          ...prev,
          farmer: response.data!
        }));
        
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Update failed' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const contextValue: SecureAuthContextType = {
    ...authState,
    login,
    register,
    logout,
    checkFarmerExists,
    getDefaultTenant,
    updateProfile,
    loading,
    isOnline,
  };

  return (
    <SecureAuthContext.Provider value={contextValue}>
      {children}
    </SecureAuthContext.Provider>
  );
};
