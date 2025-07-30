
import { RootState } from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized state management service to coordinate between Redux and React Query
 * This service defines clear boundaries for what goes where
 */
export class StateManager {
  private static instance: StateManager;
  private queryClient: QueryClient | null = null;

  static getInstance(): StateManager {
    if (!this.instance) {
      this.instance = new StateManager();
    }
    return this.instance;
  }

  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  /**
   * Redux should manage:
   * - Authentication state
   * - User preferences (language, theme)
   * - App-wide settings
   * - Offline sync state
   */
  getReduxManagedData() {
    return {
      auth: 'Authentication state, user ID, tokens',
      farmer: 'User preferences, selected language, location',
      consolidated: 'UI state, preferences, app settings',
      sync: 'Offline sync status, network state',
      offline: 'Queued actions, cached data for offline use'
    };
  }

  /**
   * React Query should manage:
   * - Server state (API data)
   * - Cache management
   * - Background refetching
   * - Optimistic updates
   * - Loading states for API calls
   */
  getReactQueryManagedData() {
    return {
      tenant: 'Tenant data, branding, features from API',
      profile: 'User profile data from server',
      dashboard: 'Dashboard data, analytics',
      weather: 'Weather data, forecasts',
      lands: 'Land management data',
      crops: 'Crop information from server'
    };
  }

  /**
   * Clear overlapping state - remove data that exists in both systems
   */
  auditStateOverlap(): string[] {
    return [
      'User profile cached in Redux and also fetched via React Query',
      'Language preferences stored in Redux but also in React Query for server sync'
    ];
  }

  /**
   * Invalidate related React Query caches when Redux state changes
   */
  invalidateQueriesOnReduxChange(stateChange: keyof RootState): void {
    if (!this.queryClient) return;

    switch (stateChange) {
      case 'auth':
        this.queryClient.invalidateQueries({ queryKey: ['optimized-profile'] });
        this.queryClient.invalidateQueries({ queryKey: ['unified-tenant-data'] });
        break;
      case 'consolidated':
        this.queryClient.invalidateQueries({ queryKey: ['unified-tenant-data'] });
        break;
      case 'farmer':
        this.queryClient.invalidateQueries({ queryKey: ['optimized-profile'] });
        break;
    }
  }
}
