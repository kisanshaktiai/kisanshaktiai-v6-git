
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  phoneNumber: string | null;
  deviceId: string | null;
  token: string | null;
  onboardingCompleted: boolean;
  biometricEnabled: boolean;
  userId: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  phoneNumber: null,
  deviceId: null,
  token: null,
  onboardingCompleted: false,
  biometricEnabled: false,
  userId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<{
      phoneNumber: string;
      deviceId: string;
      token: string;
      userId?: string;
    }>) => {
      state.isAuthenticated = true;
      state.phoneNumber = action.payload.phoneNumber;
      state.deviceId = action.payload.deviceId;
      state.token = action.payload.token;
      state.userId = action.payload.userId || null;
    },
    setOnboardingCompleted: (state) => {
      state.onboardingCompleted = true;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.phoneNumber = null;
      state.deviceId = null;
      state.token = null;
      state.onboardingCompleted = false;
      state.userId = null;
    },
    // Add action to sync with Supabase auth
    syncWithSupabaseAuth: (state, action: PayloadAction<{
      isAuthenticated: boolean;
      userId?: string;
    }>) => {
      if (action.payload.isAuthenticated && action.payload.userId) {
        state.isAuthenticated = true;
        state.userId = action.payload.userId;
        state.onboardingCompleted = true; // If user exists in Supabase, onboarding is done
      } else {
        state.isAuthenticated = false;
        state.userId = null;
      }
    },
  },
});

export const { 
  setAuthenticated, 
  setOnboardingCompleted, 
  setBiometricEnabled, 
  logout,
  syncWithSupabaseAuth
} = authSlice.actions;

export default authSlice.reducer;
