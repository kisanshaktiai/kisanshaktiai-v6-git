
import { useEffect } from 'react';
import { ServiceWorkerManager } from '@/services/ServiceWorkerManager';
import { CoreWebVitalsMonitor } from '@/services/performance/CoreWebVitalsMonitor';
import { CustomMetricsTracker } from '@/services/performance/CustomMetricsTracker';
import { PerformanceBudgetManager } from '@/services/performance/PerformanceBudgetManager';

export const useServiceInitialization = (tenantId?: string, userId?: string) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeServices = async () => {
      // Initialize service worker
      const serviceWorkerManager = ServiceWorkerManager.getInstance();
      await serviceWorkerManager.initialize();

      // Initialize performance monitoring
      const coreVitalsMonitor = CoreWebVitalsMonitor.getInstance();
      coreVitalsMonitor.initialize();

      // Set up performance budget alerts
      const budgetManager = PerformanceBudgetManager.getInstance();
      budgetManager.onAlert((alert) => {
        console.warn('Performance alert:', alert);
        // Could integrate with notification system
      });

      console.log('✅ All services initialized');
    };

    initializeServices();

    // Cleanup function
    return () => {
      CoreWebVitalsMonitor.getInstance().cleanup();
      CustomMetricsTracker.getInstance().cleanup();
      ServiceWorkerManager.getInstance().cleanup();
    };
  }, [tenantId, userId]);

  return {
    serviceWorkerManager: ServiceWorkerManager.getInstance(),
    coreVitalsMonitor: CoreWebVitalsMonitor.getInstance(),
    customMetricsTracker: CustomMetricsTracker.getInstance(),
    budgetManager: PerformanceBudgetManager.getInstance(),
  };
};
