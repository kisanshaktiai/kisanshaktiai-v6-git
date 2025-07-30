
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Consolidated slice for app-wide state that should NOT be managed by React Query
 * This includes: UI state, user preferences, app settings, offline state
 */

interface ConsolidatedState {
  // UI State (not server data)
  ui: {
    sidebarOpen: boolean;
    currentTheme: 'light' | 'dark' | 'system';
    activeModal: string | null;
  };
  
  // User Preferences (cached locally, synced to server via React Query)
  preferences: {
    language: string;
    notifications: boolean;
    dataUsage: 'low' | 'normal' | 'high';
  };
  
  // App Settings (not user-specific)
  settings: {
    debugMode: boolean;
    performanceMode: boolean;
    offlineMode: boolean;
  };
}

const initialState: ConsolidatedState = {
  ui: {
    sidebarOpen: false,
    currentTheme: 'system',
    activeModal: null,
  },
  preferences: {
    language: 'hi',
    notifications: true,
    dataUsage: 'normal',
  },
  settings: {
    debugMode: false,
    performanceMode: false,
    offlineMode: false,
  },
};

const consolidatedSlice = createSlice({
  name: 'consolidated',
  initialState,
  reducers: {
    // UI Actions
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.ui.currentTheme = action.payload;
    },
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.ui.activeModal = action.payload;
    },
    
    // Preference Actions
    setLanguage: (state, action: PayloadAction<string>) => {
      state.preferences.language = action.payload;
    },
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.preferences.notifications = action.payload;
    },
    setDataUsage: (state, action: PayloadAction<'low' | 'normal' | 'high'>) => {
      state.preferences.dataUsage = action.payload;
    },
    
    // Settings Actions
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.settings.debugMode = action.payload;
    },
    setPerformanceMode: (state, action: PayloadAction<boolean>) => {
      state.settings.performanceMode = action.payload;
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.settings.offlineMode = action.payload;
    },
  },
});

export const {
  setSidebarOpen,
  setTheme,
  setActiveModal,
  setLanguage,
  setNotifications,
  setDataUsage,
  setDebugMode,
  setPerformanceMode,
  setOfflineMode,
} = consolidatedSlice.actions;

export default consolidatedSlice.reducer;
