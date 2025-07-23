
import { defaultTenantService } from './defaultTenantService';

class AppInitService {
  private static instance: AppInitService;
  private initialized = false;

  static getInstance(): AppInitService {
    if (!AppInitService.instance) {
      AppInitService.instance = new AppInitService();
    }
    return AppInitService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing app...');
      
      // Fetch and cache default tenant on app start
      const tenantId = await defaultTenantService.getDefaultTenantId();
      
      if (tenantId) {
        console.log('App initialized with default tenant:', tenantId);
      } else {
        console.warn('No default tenant found during initialization');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error during app initialization:', error);
      // Don't throw error to prevent app from crashing
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const appInitService = AppInitService.getInstance();
