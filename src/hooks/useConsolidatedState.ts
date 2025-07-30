
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  setSidebarOpen,
  setTheme,
  setActiveModal,
  setLanguage,
  setNotifications,
  setDataUsage,
  setDebugMode,
  setPerformanceMode,
  setOfflineMode,
} from '@/store/slices/consolidatedSlice';

/**
 * Custom hook for accessing consolidated app state
 * This replaces scattered local state usage across components
 */
export const useConsolidatedState = () => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state.consolidated);

  return {
    // UI State
    ui: state.ui,
    setSidebarOpen: (open: boolean) => dispatch(setSidebarOpen(open)),
    setTheme: (theme: 'light' | 'dark' | 'system') => dispatch(setTheme(theme)),
    setActiveModal: (modal: string | null) => dispatch(setActiveModal(modal)),

    // Preferences
    preferences: state.preferences,
    setLanguage: (language: string) => dispatch(setLanguage(language)),
    setNotifications: (enabled: boolean) => dispatch(setNotifications(enabled)),
    setDataUsage: (usage: 'low' | 'normal' | 'high') => dispatch(setDataUsage(usage)),

    // Settings
    settings: state.settings,
    setDebugMode: (enabled: boolean) => dispatch(setDebugMode(enabled)),
    setPerformanceMode: (enabled: boolean) => dispatch(setPerformanceMode(enabled)),
    setOfflineMode: (enabled: boolean) => dispatch(setOfflineMode(enabled)),
  };
};
