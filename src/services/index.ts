
// Core Services
export { supabase } from '@/integrations/supabase/client';
export { ServiceWorkerManager } from './ServiceWorkerManager';
export { TenantDataService } from './TenantDataService';

// Performance Services
export { CoreWebVitalsMonitor } from './performance/CoreWebVitalsMonitor';
export { CustomMetricsTracker } from './performance/CustomMetricsTracker';
export { PerformanceBudgetManager } from './performance/PerformanceBudgetManager';
export { PerformanceMonitor } from './PerformanceMonitor';

// Weather Services
export { GeographicWeatherCache } from './weather/GeographicWeatherCache';
export { WeatherPredictiveCache } from './weather/WeatherPredictiveCache';

// Auth & Data Services
export { 
  fetchProfile, 
  updateProfile, 
  signOut as authSignOut, 
  checkUserExists, 
  signInWithPhone 
} from './authService';
export { OptimizedDataService } from './OptimizedDataService';
export { LanguageService } from './LanguageService';

// Storage Services
export { secureStorage } from './storage/secureStorage';
export { SyncService } from './SyncService';

// Offline Services
export { db } from './offline/db';
export { syncService } from './offline/syncService';
