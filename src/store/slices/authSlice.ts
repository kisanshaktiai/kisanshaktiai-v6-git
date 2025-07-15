
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  phoneNumber: string | null;
  deviceId: string | null;
  token: string | null;
  onboardingCompleted: boolean;
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  phoneNumber: null,
  deviceId: null,
  token: null,
  onboardingCompleted: false,
  biometricEnabled: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<{
      phoneNumber: string;
      deviceId: string;
      token: string;
    }>) => {
      state.isAuthenticated = true;
      state.phoneNumber = action.payload.phoneNumber;
      state.deviceId = action.payload.deviceId;
      state.token = action.payload.token;
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
    },
  },
});

export const { 
  setAuthenticated, 
  setOnboardingCompleted, 
  setBiometricEnabled, 
  logout 
} = authSlice.actions;

export default authSlice.reducer;
