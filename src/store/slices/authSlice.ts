
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  phoneNumber: string | null;
  onboardingCompleted: boolean;
  currentTenant: string | null; // Track current tenant ID
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  phoneNumber: null,
  onboardingCompleted: false,
  currentTenant: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<{ userId: string; phoneNumber?: string }>) => {
      state.isAuthenticated = true;
      state.userId = action.payload.userId;
      if (action.payload.phoneNumber) {
        state.phoneNumber = action.payload.phoneNumber;
      }
    },
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    setOnboardingCompleted: (state) => {
      state.onboardingCompleted = true;
    },
    setCurrentTenant: (state, action: PayloadAction<string>) => {
      state.currentTenant = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.userId = null;
      state.phoneNumber = null;
      state.onboardingCompleted = false;
      state.currentTenant = null;
    },
  },
});

export const { 
  setAuthenticated, 
  setPhoneNumber, 
  setOnboardingCompleted, 
  setCurrentTenant, 
  logout 
} = authSlice.actions;

export default authSlice.reducer;
